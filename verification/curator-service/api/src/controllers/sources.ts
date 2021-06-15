import axios from 'axios';
import { Request, Response } from 'express';
import { Source, SourceDocument } from '../model/source';

import AwsBatchClient from '../clients/aws-batch-client';
import AwsEventsClient from '../clients/aws-events-client';
import EmailClient from '../clients/email-client';

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
            const [docs, total] = await Promise.all([
                Source.find(filter)
                    .sort({ name: 1 })
                    .skip(limit * (page - 1))
                    .limit(limit + 1)
                    .lean(),
                Source.countDocuments({}),
            ]);
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
     * Get a single source.
     */
    get = async (req: Request, res: Response): Promise<void> => {
        const doc = await Source.findById(req.params.id);
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
            const source = await Source.findById(req.params.id);
            if (!source) {
                res.status(404).json({
                    message: `source with id ${req.params.id} could not be found`,
                });
                return;
            }
            // Undefined fields are removed from the request body by openapi
            // validator, if we want to unset the dateFilter we have to pass an
            // empty object and set it undefined ourselves here.
            if (JSON.stringify(req.body.dateFilter) === '{}') {
                req.body.dateFilter = undefined;
            }
            await source.set(req.body).validate();
            const emailNotificationType = await this.updateAutomationScheduleAwsResources(
                source,
            );
            const result = await source.save();
            await this.sendNotifications(source, emailNotificationType);
            res.json(result);
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
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
        source: SourceDocument,
    ): Promise<NotificationType> {
        if (this.automationScheduleModified(source)) {
            if (source.automation?.schedule?.awsScheduleExpression) {
                const awsRuleArn = await this.awsEventsClient.putRule(
                    source.toAwsRuleName(),
                    source.toAwsRuleDescription(),
                    source.automation.schedule.awsScheduleExpression,
                    this.batchClient.jobQueueArn,
                    source.toAwsRuleTargetId(),
                    source._id.toString(),
                    source.toAwsStatementId(),
                );
                source.set('automation.schedule.awsRuleArn', awsRuleArn);
                return NotificationType.Add;
            } else {
                await this.awsEventsClient.deleteRule(
                    source.toAwsRuleName(),
                    source.toAwsRuleTargetId(),
                    this.batchClient.jobQueueArn,
                    source.toAwsStatementId(),
                );
                source.set('automation.schedule', undefined);
                return NotificationType.Remove;
            }
        } else if (
            source.isModified('name') &&
            source.automation?.schedule?.awsRuleArn
        ) {
            await this.awsEventsClient.putRule(
                source.toAwsRuleName(),
                source.toAwsRuleDescription(),
            );
            return NotificationType.None;
        }
        return NotificationType.None;
    }

    /**
     * Determines whether the automation schedule for a given source was modified.
     *
     * This helper is necessary to encapsulate oddities with modified paths in
     * Mongoose. If one field of a subdocument is modified, all fields of the
     * subdocument will return true for calls to subDoc.isModified('field').
     *
     * We use isDirectModified() in combination with modifiedPaths() to produce
     * an accurate decision.
     */
    private automationScheduleModified(source: SourceDocument): boolean {
        return (
            source.automation?.modifiedPaths().includes('schedule') ||
            (source.isDirectModified('automation') &&
                !source.automation.modifiedPaths().includes('parser'))
        );
    }

    /**
     * Create a single source.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const source = new Source(req.body);
            await source.validate();
            await this.createAutomationScheduleAwsResources(source);
            const result = await source.save();
            res.status(201).json(result);
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
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
        source: SourceDocument,
    ): Promise<void> {
        if (source.automation?.schedule) {
            const createdRuleArn = await this.awsEventsClient.putRule(
                source.toAwsRuleName(),
                source.toAwsRuleDescription(),
                source.automation.schedule.awsScheduleExpression,
                this.batchClient.jobQueueArn,
                source.toAwsRuleTargetId(),
                source._id.toString(),
                source.toAwsStatementId(),
            );
            source.set('automation.schedule.awsRuleArn', createdRuleArn);
            await this.sendNotifications(source, NotificationType.Add);
        }
    }

    /**
     * Delete a single source.
     */
    del = async (req: Request, res: Response): Promise<void> => {
        const source = await Source.findById(req.params.id);
        if (!source) {
            res.sendStatus(404);
            return;
        }
        if (source.automation?.schedule?.awsRuleArn) {
            await this.awsEventsClient.deleteRule(
                source.toAwsRuleName(),
                source.toAwsRuleTargetId(),
                this.batchClient.jobQueueArn,
                source.toAwsStatementId(),
            );
            await this.sendNotifications(source, NotificationType.Remove);
        }
        source.remove();
        res.status(204).end();
        return;
    };

    /** Mark all of the cases for this source as pending removal. */
    markPendingRemoval = async (req: Request, res: Response): Promise<void> => {
        const source = await Source.findById(req.params.id);
        if (!source) {
            res.sendStatus(404).end();
            return;
        }
        if (source.hasStableIdentifiers) {
            res.sendStatus(400).end();
            return;
        }
        try {
            const response = await axios.post(`${this.dataServerURL}/api/cases/markPendingRemoval?sourceId=${req.params.id}`);
            if (response.status == 201) {
                res.sendStatus(201).end();
            } else {
                res.status(response.status).json(response.data);
            }
        } catch (err) {
            console.error(err);
            res.status(500).json(err);
        }
    }

    /** Delete all of the cases for this source that are pending removal. */
    removePendingCases = async (req: Request, res: Response): Promise<void> => {
        const source = await Source.findById(req.params.id);
        if (!source) {
            res.sendStatus(404).end();
            return;
        }
        if (source.hasStableIdentifiers) {
            res.sendStatus(400).end();
            return;
        }
        try {
            const response = await axios.post(`${this.dataServerURL}/api/cases/removePendingCases?sourceId=${req.params.id}`);
            if (response.status == 201) {
                res.sendStatus(201).end();
            } else {
                res.status(response.status).json(response.data);
            }
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /** Remove the 'pending removal' flag from all cases for this source. */
    clearPendingRemovalStatus = async (req: Request, res: Response): Promise<void> => {
        const source = await Source.findById(req.params.id);
        if (!source) {
            res.sendStatus(404).end();
            return;
        }
        if (source.hasStableIdentifiers) {
            res.sendStatus(400).end();
            return;
        }
        try {
            const response = await axios.post(`${this.dataServerURL}/api/cases/clearPendingRemovalStatus?sourceId=${req.params.id}`);
            if (response.status == 201) {
                res.sendStatus(201).end();
            } else {
                res.status(response.status).json(response.data);
            }
        } catch (err) {
            res.status(500).json(err);
        }
    }

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
        source: SourceDocument,
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
            throw {
                ...err,
                name: 'NotificationSendError',
            };
        }
    }
}
