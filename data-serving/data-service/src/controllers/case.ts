import { Request, Response } from 'express';

import { Case } from '../model/case';

/**
 * Get a specific case.
 *
 * Handles HTTP GET /api/cases/:id.
 */
export const get = async (req: Request, res: Response): Promise<void> => {
    const c = await Case.findById(req.params.id);
    if (!c) {
        res.status(404).send(`Case with ID ${req.params.id} not found.`);
        return;
    }
    res.json(c);
};

/**
 * List all cases.
 *
 * Handles HTTP GET /api/cases.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    const cases = await Case.find({});
    res.json(cases);
};

/**
 * Create a case.
 *
 * Handles HTTP POST /api/cases.
 */
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const c = new Case(req.body);
        const result = await c.save();
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

/**
 * Update a specific case.
 *
 * Handles HTTP PUT /api/cases/:id.
 */
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const c = await Case.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!c) {
            res.status(404).send(`Case with ID ${req.params.id} not found.`);
            return;
        }
        res.json(c);
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
 * Delete a specific case.
 *
 * Handles HTTP DELETE /api/cases/:id.
 */
export const del = async (req: Request, res: Response): Promise<void> => {
    const c = await Case.findByIdAndDelete(req.params.id, req.body);
    if (!c) {
        res.status(404).send(`Case with ID ${req.params.id} not found.`);
        return;
    }
    res.json(c);
};
