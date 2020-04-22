import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { Case, validOutcomes } from '../model/case';

/**
 * Get a specific case.
 *
 * Handles HTTP GET /cases/:id.
 */
export const get = (req: Request, res: Response): void => {
    res.send(`Triggered get case with ID ${req.params.id}.`);
};

/**
 * List all cases.
 *
 * Handles HTTP GET /cases.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    const cases = await Case.find({});
    res.json(cases);
};

/**
 * Create a case.
 *
 * Handles HTTP POST /cases.
 */
export const create = async (req: Request, res: Response): Promise<void> => {
    await check('outcome', `Outcome must be one of: ${validOutcomes}`)
        .isIn(validOutcomes)
        .run(req);
    await check('date', 'Date must be a valid ISO 8601 date.')
        .isISO8601()
        .run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const c = new Case({
        date: req.body.date,
        outcome: req.body.outcome,
    });
    const result = await c.save();
    res.json(result);
};

/**
 * Update a specific case.
 *
 * Handles HTTP PUT /cases/:id.
 */
export const update = (req: Request, res: Response): void => {
    res.send(`Triggered update case with ID ${req.params.id}.`);
};

/**
 * Delete a specific case.
 *
 * Handles HTTP DELETE /cases/:id.
 */
export const del = (req: Request, res: Response): void => {
    res.send(`Triggered delete case with ID ${req.params.id}.`);
};
