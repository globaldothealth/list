import { Request, Response } from 'express';

import { Source } from '../model/source';

export default class UploadsController {
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const source = await Source.findById(req.params.sourceId);
            if (!source) {
                res.status(404).json(
                    `Parent resource (source ID ${req.params.id}) not found.`,
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
}
