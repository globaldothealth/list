import { Request, Response } from 'express';
import { Source } from '../model/source';

/**
 * List the sources.
 * Response will contain {sources: [list of sources]}
 * and potentially another nextPage: <num> if more results are available.
 * Default values of 10 for limit and 1 for page is used.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    if (page < 1) {
        res.status(422).json('page must be > 0');
        return;
    }
    if (limit < 1) {
        res.status(422).json('limit must be > 0');
        return;
    }
    const docs = await Source.find({})
        .skip(limit * (page - 1))
        .limit(limit + 1);
    // If we have more items than limit, add a response param
    // indicating that there is more to fetch on the next page.
    if (docs.length == limit + 1) {
        docs.splice(limit);
        res.json({
            sources: docs,
            nextPage: page + 1,
        });
        return;
    }
    // If we fetched all available data, just return it.
    res.json({ sources: docs });
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
