import { Request, Response } from 'express';

import { Source } from '../model/source';

export default class UploadsController {
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const source = await Source.findById(req.params.sourceId);
            if (!source) {
                res.status(404).json(
                    `Parent resource (source ID ${req.params.sourceId}) not found.`,
                );
                return;
            }
            source.uploads.push(req.body);
            const updatedSource = await source.save();
            const result =
                updatedSource.uploads[updatedSource.uploads.length - 1];
            res.status(201).json(result);
            return;
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err.message);
                return;
            }
            res.status(500).json(err.message);
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const source = await Source.findById(req.params.sourceId);
            if (!source) {
                res.status(404).json(
                    `Parent resource (source ID ${req.params.sourceId}) not found.`,
                );
                return;
            }
            const upload = source.uploads.find(
                (u) => u._id.toString() === req.params.id,
            );
            if (!upload) {
                res.status(404).json(
                    `Upload with ID ${req.params.id}) not found in source ${req.params.sourceId}.`,
                );
                return;
            }
            await upload.set(req.body).validate();
            const result = await source.save();
            res.json(result);
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err.message);
                return;
            }
            res.status(500).json(err.message);
            return;
        }
    };

    list = async (req: Request, res: Response): Promise<void> => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        try {
            const [uploads, total] = await Promise.all([
                Source.aggregate([
                    { $unwind: '$uploads' },
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
            res.status(500).json(err.message);
            return;
        }
    };
}
