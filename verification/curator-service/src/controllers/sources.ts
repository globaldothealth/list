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
        res.sendStatus(404);
        return;
    }
    res.json(doc);
};

/**
 * Update a single source.
 */
export const update = (req: Request, res: Response): void => {
    res.sendStatus(501);
    return;
};

/**
 * Create a single source.
 */
export const create = (req: Request, res: Response): void => {
    res.sendStatus(501);
    return;
};

/**
 * Delete a single source.
 */
export const del = (req: Request, res: Response): void => {
    res.sendStatus(501);
    return;
};
