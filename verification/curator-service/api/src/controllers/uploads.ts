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
        try {
            const uploads = await Source.aggregate([
                { $unwind: '$uploads' },
                {
                    $project: {
                        _id: 0,
                        sourceName: '$name',
                        sourceUrl: '$origin.url',
                        upload: '$uploads',
                    },
                },
            ]);
            res.json({ uploads: uploads });
            return;
        } catch (err) {
            res.status(500).json(err.message);
            return;
        }
    };
}
