import { Request, Response } from 'express';

import { sources, Source, ISource } from '../model/source';
import EmailClient from '../clients/email-client';
import { IUpload } from '../model/upload';
import { ObjectId } from 'mongodb';

/**
 * UploadsController handles single uploads, that is a batch of cases sent
 * together that can be verified by a curator together as well.
 */
export default class UploadsController {
    constructor(private readonly emailClient: EmailClient) {}

    /**
     * Creates a new upload for the source present in the req.params.sourceId.
     * The source with the added upload is sent in the response.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const sourceId = new ObjectId(req.params.sourceId);
            const source = await sources().findOne({ _id: sourceId });
            if (!source) {
                res.status(404).json({
                    message: `Parent resource (source ID ${req.params.sourceId}) not found.`,
                });
                return;
            }
            const upload = req.body;
            if (!upload._id) {
                upload._id = new ObjectId();
            } else {
                upload._id = new ObjectId(upload._id);
            }
            const result = await sources().findOneAndUpdate(
                { _id: sourceId },
                {
                    $push: {
                        uploads: upload,
                    }
                },
                { returnDocument: 'after' },
            );
            const updatedSource = result.value;
            const update =
                updatedSource.uploads[updatedSource.uploads.length - 1];
            if (update.status === 'ERROR') {
                this.sendErrorNotification(updatedSource, update);
            }
            res.status(201).json(updatedSource);
            return;
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
        }
    };

    /**
     * Update an existing upload.
     * The updated source is sent in the response.
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const sourceId = new ObjectId(req.params.sourceId);
            const source = await sources().findOne({ _id: sourceId });
            if (!source) {
                res.status(404).json({
                    message: `Parent resource (source ID ${req.params.sourceId}) not found.`,
                });
                return;
            }
            const upload = source.uploads.find(
                (u: IUpload) => u._id.toString() === req.params.id,
            );
            if (!upload) {
                res.status(404).json({
                    message: `Upload with ID ${req.params.id}) not found in source ${req.params.sourceId}.`,
                });
                return;
            }
            const uploadIndex = source.uploads.indexOf(upload);
            Object.assign(upload, req.body);

            const result = await sources().findOneAndUpdate(
                { _id: sourceId },
                {
                    $set: {
                        [`uploads.${uploadIndex}`]: upload,
                    },
                },
                { returnDocument: 'after' },
            );
            if (upload.status === 'ERROR') {
                this.sendErrorNotification(result.value, upload);
            }
            res.json(result.value);
        } catch (err) {
            const error = err as Error;
            if (error.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Lists all the uploads.
     * A default pagination of 10 items per page is used.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const changesOnlyMatcher = req.query.changes_only
            ? [
                  {
                      $match: {
                          $or: [
                              { 'uploads.status': { $ne: 'SUCCESS' } },
                              { 'uploads.summary.numCreated': { $gt: 0 } },
                              { 'uploads.summary.numUpdated': { $gt: 0 } },
                          ],
                      },
                  },
              ]
            : [];
        try {
            const [uploads, total] = await Promise.all([
                Source.aggregate([
                    { $unwind: '$uploads' },
                    ...changesOnlyMatcher,
                    { $sort: { 'uploads.created': -1, name: -1 } },
                    { $skip: limit * (page - 1) },
                    { $limit: limit + 1 },
                    {
                        $project: {
                            _id: false,
                            sourceName: '$name',
                            sourceUrl: '$origin.url',
                            upload: '$uploads',
                        },
                    },
                ]),
                Source.aggregate([
                    { $unwind: '$uploads' },
                    ...changesOnlyMatcher,
                    { $count: 'total' },
                ]),
            ]);
            // If we have more items than limit, add a response param
            // indicating that there is more to fetch on the next page.
            if (uploads.length == limit + 1) {
                uploads.splice(limit);
                res.json({
                    uploads: uploads,
                    nextPage: page + 1,
                    ...total[0],
                });
                return;
            }
            // If we fetched all available data, just return it.
            res.json({ uploads: uploads, ...total[0] });
            return;
        } catch (err) {
            res.status(500).json(err);
            return;
        }
    };

    private async sendErrorNotification(
        source: ISource,
        upload: IUpload,
    ): Promise<void> {
        if (
            source.automation?.schedule &&
            source.notificationRecipients?.length > 0
        ) {
            const subject = 'Automated upload failed for source';
            const text = `An automated upload failed for the following source in G.h List;
                    \n
                    \tID: ${source._id}
                    \tName: ${source.name}
                    \tURL: ${source.origin.url}
                    \tFormat: ${source.format}
                    \tSchedule: ${source.automation.schedule.awsScheduleExpression}
                    \tParser: ${source.automation.parser?.awsLambdaArn}
                    \n
                    Upload details:
                    \n
                    \tID: ${upload._id}
                    \tError: ${upload.summary?.error}
                    \tStart: ${upload.created}`;
            await this.emailClient.send(
                source.notificationRecipients,
                subject,
                text,
            );
        }
    }
}
