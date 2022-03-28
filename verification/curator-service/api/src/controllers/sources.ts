import axios from 'axios';
import { Request, Response } from 'express';
import { cases, restrictedCases } from '../model/case';
import { awsRuleDescriptionForSource, awsRuleNameForSource, awsRuleTargetForSource, awsStatementIdForSource, ISource, sources } from '../model/source';

import AwsBatchClient from '../clients/aws-batch-client';
import AwsEventsClient from '../clients/aws-events-client';
import EmailClient from '../clients/email-client';
import { logger } from '../util/logger';
import { ObjectId } from 'mongodb';
import { IUpload } from '../model/upload';

/**
 * Email notification that should be sent on any update to a source.
 */
enum NotificationType {
    /**
     * Send the email that a schedule has been added.
     */
    Add = 'Add',
    /**
     * Send the email that a schedule has been removed.
     */
    Remove = 'Remove',
    /**
     * No change that requires email notification has been made.
     */
    None = 'None',
}

/**
 * SourcesController handles HTTP requests from curators and automated ingestion
 * functions related to sources of case data.
 */
export default class SourcesController {
    constructor(
        private readonly emailClient: EmailClient,
        private readonly batchClient: AwsBatchClient,
        private readonly awsEventsClient: AwsEventsClient,
        private readonly dataServerURL: string,
    ) {}

    /**
     * List the sources.
     * Response will contain {sources: [list of sources]}
     * and potentially another nextPage: <num> if more results are available.
     * Default values of 10 for limit and 1 for page is used.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        if (page < 1) {
            res.status(422).json({ message: 'page must be > 0' });
            return;
        }
        if (limit < 1) {
            res.status(422).json({ message: 'limit must be > 0' });
            return;
        }
        const filter = req.query.url
            ? {
                  'origin.url': new RegExp(req.query.url as string, 'i'),
              }
            : {};
        try {
            const [cursor, total] = await Promise.all([
                sources().find(filter,
                    {
                        sort: { name: 1 },
                        skip: limit * (page - 1),
                        limit: (limit + 1),
                    }),
                sources().countDocuments(filter),
            ]);
            const docs = await cursor.toArray();
            // If we have more items than limit, add a response param
            // indicating that there is more to fetch on the next page.
            if (docs.length == limit + 1) {
                docs.splice(limit);
                res.json({
                    sources: docs,
                    nextPage: page + 1,
                    total: total,
                });
                return;
            }
            // If we fetched all available data, just return it.
            res.json({ sources: docs, total: total });
        } catch (e) {
            res.status(422).json(e);
            return;
        }
    };

    /**
     * Get sources for the acknowledgement table
     * This is a public endpoint because acknowledgement table needs to
     * be accessible without logging in
     */
    listSourcesForTable = async (req: Request, res: Response) => {
        try {
            const providers = await sources().find({}).project({
                name: 1,
                'origin.providerName': 1,
                'origin.providerWebsiteUrl': 1,
                'origin.url': 1,
                'origin.license': 1,
            });

            return res.json(providers);
        } catch (err) {
            const error = err as Error;
            if (error.name === 'ValidationError') {
                res.status(422).json(error);
                return;
            }

            res.status(500).json(err);
            return;
        }
    };

    /**
     * Get a single source.
     */
    get = async (req: Request, res: Response): Promise<void> => {
        const doc = await sources().findOne({ _id: new ObjectId(req.params.id) });
        if (!doc) {
            res.status(404).json({
                message: `source with id ${req.params.id} could not be found`,
            });
            return;
        }
        res.json(doc);
    };

    /**
     * Update a single source.
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const sourceId = new ObjectId(req.params.id);
            let source = await sources().findOne({ _id: sourceId });
            if (!source) {
                res.status(404).json({
                    message: `source with id ${req.params.id} could not be found`,
                });
                return;
            }
            // Undefined fields are removed from the request body by openapi
            // validator, if we want to unset the dateFilter we have to pass an
            // empty object and unset it ourselves here.
            const update : { $set: any, $unset?: any } = {
                $set: {
                    ...req.body,
                },
                $unset: {},
            };
            if (JSON.stringify(req.body.dateFilter) === '{}') {
                update['$unset']['dateFilter'] = '';
                delete update['$set']['dateFilter'];
            };
            // turn an undefined schedule into a request to remove the schedule
            let change: 'schedule' | 'name' | 'other' = 'other';
            if (req.body['automation']) {
                change = 'schedule';
                if (!req.body['automation']['schedule']) {
                    update['$set']['automation']['schedule'] = undefined;
                    /*
                     * what gets sent from the client is { automation: { schedule: undefined }}
                     * what we receive from express is { automation: {}}
                     * it would be a conflict to try to simultaneously $set automation and
                     * $unset automation.schedule, so instead $set automation.schedule to
                     * undefined here.
                     */
                }
            }
            await sources().updateOne({_id: sourceId }, update);
            source = await sources().findOne({ _id: sourceId });
            if (req.body['name']) {
                change = 'name';
            }
            
            const emailNotificationType =
                await this.updateAutomationScheduleAwsResources(source, change);
            
            source = await sources().findOne({ _id: sourceId });
            await this.sendNotifications(source, emailNotificationType);
            res.json(source);
        } catch (err) {
            const error = err as Error;
            logger.error(error);
            if (error.name === 'ValidationError') {
                res.status(422).json(error);
                return;
            }
            res.status(500).json(error);
            return;
        }
    };

    /**
     * Performs updates on AWS assets corresponding to the provided source,
     * based on the content of the update operation.
     *
     * Note that, because Mongoose document validation is currently used for all
     * of our APIs, and we're performing partial updates (as opposed to
     * overwrites) by default, the condition in which a validated field is
     * updated to be empty is unreachable.
     *
     * TODO: Allow deleting schema-validated fields in update operations.
     *
     * @returns Indication of what kind of email notification, if any, should be sent to interested curators
     * about this change.
     */
    private async updateAutomationScheduleAwsResources(
        source: ISource,
        change: 'schedule' | 'name' | 'other'
    ): Promise<NotificationType> {
        if (change === 'schedule') {
            if (source.automation?.schedule?.awsScheduleExpression) {
                const awsRuleArn = await this.awsEventsClient.putRule(
                    awsRuleNameForSource(source),
                    awsRuleDescriptionForSource(source),
                    source.automation.schedule.awsScheduleExpression,
                    this.batchClient.jobQueueArn,
                    awsRuleTargetForSource(source),
                    source._id.toString(),
                    awsStatementIdForSource(source),
                );
                await sources().updateOne({
                    _id: source._id,
                }, {
                    $set: {
                        'automation.schedule.awsRuleArn': awsRuleArn,
                    },
                });
                return NotificationType.Add;
            } else {
                await this.awsEventsClient.deleteRule(
                    awsRuleNameForSource(source),
                    awsRuleTargetForSource(source),
                    this.batchClient.jobQueueArn,
                    awsStatementIdForSource(source),
                );
                await sources().updateOne({
                    _id: source._id,
                }, {
                    $unset: {
                        'automation.schedule': '',
                    },
                });
                return NotificationType.Remove;
            }
        } else if (
            change === 'name' &&
            source.automation?.schedule?.awsRuleArn
        ) {
            await this.awsEventsClient.putRule(
                awsRuleNameForSource(source),
                awsRuleDescriptionForSource(source),
            );
            return NotificationType.None;
        }
        return NotificationType.None;
    }

    /**
     * Create a single source.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const sourceId = new ObjectId();
            const sourceToInsert = {
                _id: sourceId,
                ...req.body,
            };

            if (sourceToInsert.uploads) {
                sourceToInsert.uploads = sourceToInsert.uploads.map((u: IUpload) => {
                    if (u.created) {
                        u.created = new Date(u.created);
                    }
                    if (u._id) {
                        u._id = new ObjectId(u._id);
                    }
                    return u;
                });
            }

            const insertResult = await sources().insertOne(sourceToInsert);
            if (!insertResult.result.ok) {
                // TODO: work out how to get the details of the error
                res.status(500).json({
                    message: 'Could not insert source'
                });
                return;
            }
            await this.createAutomationScheduleAwsResources(sourceId);
            const source = await sources().findOne({ _id: sourceId });
            res.status(201).json(source);
        } catch (err) {
            const error = err as Error;
            if (error.name === 'ValidationError') {
                res.status(422).json(error);
                return;
            }
            res.status(500).json(error);
        }
    };

    /**
     * Performs creation of AWS assets corresponding to the provided source,
     * based on the content of the create operation.
     *
     * If an automation schedule is present, a CloudWatch scheduled rule will
     * be created with a target of the global retrieval function. A resource-
     * based permission will be added to the global retrieval function such
     * that it can be invoked by the rule.
     */
    private async createAutomationScheduleAwsResources(
        sourceId: ObjectId,
    ): Promise<void> {
        const source = await sources().findOne({ _id: sourceId });
        if (source.automation?.schedule) {
            const createdRuleArn = await this.awsEventsClient.putRule(
                awsRuleNameForSource(source),
                awsRuleDescriptionForSource(source),
                source.automation.schedule.awsScheduleExpression,
                this.batchClient.jobQueueArn,
                awsRuleTargetForSource(source),
                sourceId.toHexString(),
                awsStatementIdForSource(source),
            );
            await sources().updateOne({ _id: sourceId }, {
                $set: {
                    'automation.schedule.awsRuleArn': createdRuleArn,
                }
            });
            await this.sendNotifications(source, NotificationType.Add);
        }
    }

    /**
     * Delete a single source.
     */
    del = async (req: Request, res: Response): Promise<void> => {
        const sourceId = new ObjectId(req.params.id);
        const source = await sources().findOne( { _id: sourceId });
        if (!source) {
            res.sendStatus(404);
            return;
        }

        const query = { 'caseReference.sourceId': sourceId };
        const count = await cases().countDocuments(query);
        const restrictedCount = await restrictedCases().countDocuments(query);
        if (count + restrictedCount !== 0) {
            res.status(403).json({
                message: 'Source still has cases and cannot be deleted.',
            });
            return;
        }

        if (source.automation?.schedule?.awsRuleArn) {
            await this.awsEventsClient.deleteRule(
                awsRuleNameForSource(source),
                awsRuleTargetForSource(source),
                this.batchClient.jobQueueArn,
                awsStatementIdForSource(source),
            );
            await this.sendNotifications(source, NotificationType.Remove);
        }
        sources().deleteOne({ _id: sourceId });
        res.status(204).end();
        return;
    };

    /** Trigger retrieval of the source's content in S3. */
    retrieve = async (req: Request, res: Response): Promise<void> => {
        try {
            const parseDateRange =
                req.query.parse_start_date && req.query.parse_end_date
                    ? {
                          start: req.query.parse_start_date as string,
                          end: req.query.parse_end_date as string,
                      }
                    : undefined;
            const output = await this.batchClient.doRetrieval(
                req.params.id,
                parseDateRange,
            );
            res.json(output);
        } catch (err) {
            res.status(500).json(err);
        }
        return;
    };

    /** Lists available parsers for automated ingestion */
    listParsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const output = await this.batchClient.listParsers();
            res.json(output);
        } catch (err) {
            res.status(500).json(err);
        }
        return;
    };

    private async sendNotifications(
        source: ISource,
        type: NotificationType,
    ): Promise<void> {
        if (
            !source.notificationRecipients ||
            source.notificationRecipients.length === 0 ||
            type === NotificationType.None
        ) {
            return;
        }
        let subject: string;
        let text: string;
        switch (type) {
            case NotificationType.Add:
                subject = `Automation added for source: ${source.name}`;
                text = `Automation was configured for the following source in G.h List;
                    \n
                    \tID: ${source._id}
                    \tName: ${source.name}
                    \tURL: ${source.origin.url}
                    \tFormat: ${source.format}
                    \tSchedule: ${source.automation.schedule.awsScheduleExpression}
                    \tParser: ${source.automation.parser?.awsLambdaArn}`;
                break;
            case NotificationType.Remove:
                subject = `Automation removed for source: ${source.name}`;
                text = `Automation was removed for the following source in G.h List.
                    \n
                    \tID: ${source._id}
                    \tName: ${source.name}
                    \tURL: ${source.origin.url}
                    \tFormat: ${source.format}`;
                break;
            default:
                throw new Error(
                    `Invalid notification type trigger for source event: ${type}`,
                );
        }

        try {
            await this.emailClient.send(
                source.notificationRecipients,
                subject,
                text,
            );
        } catch (err) {
            const error = err as Error;
            throw {
                ...error,
                name: 'NotificationSendError',
            };
        }
    }
}
