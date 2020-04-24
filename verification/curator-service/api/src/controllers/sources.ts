import { Request, Response } from 'express';
import { Source } from '../model/source';

/**
 * List the sources.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    const docs = await Source.find({});
    res.json(docs);
};

/**
 * Get a single source.
 */
export const get = async (req: Request, res: Response): Promise<void> => {
    const doc = await Source.findById(req.params.id);
    if (!doc) {
        res.status(404).json(
            `source with id ${req.params.id} could not be found`,
        );
        return;
    }
    res.json(doc);
};

/**
 * Update a single source.
 */
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const source = await Source.findByIdAndUpdate(req.params.id, req.body, {
            // Return the udpated object.
            new: true,
            runValidators: true,
        });
        if (!source) {
            res.status(404).json(
                `source with id ${req.params.id} could not be found`,
            );
            return;
        }
        res.json(source);
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err.message);
            return;
        }
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Create a single source.
 */
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const source = await Source.create(req.body);
        res.location(`/sources/${source.id}`);
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err.message);
            return;
        }
        res.status(500).json(err.message);
    }
};

/**
 * Delete a single source.
 */
export const del = async (req: Request, res: Response): Promise<void> => {
    const source = await Source.findByIdAndDelete(req.params.id);
    if (!source) {
        res.sendStatus(404);
        return;
    }
    res.json(source);
    return;
};
