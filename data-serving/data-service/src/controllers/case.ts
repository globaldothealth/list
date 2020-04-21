import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';

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
export const list = (req: Request, res: Response): void => {
    res.send('Triggered list cases.');
};

/**
 * Create a case.
 *
 * Handles HTTP POST /cases.
 *
 * For now, just attempts to parse an "age" field and return it in the response.
 * Returns 422 if "age" isn't present in the request body.
 */
export const create = async (req: Request, res: Response): Promise<void> => {
    await check('age', 'Age must be a valid number')
        .not()
        .isEmpty()
        .isNumeric()
        .run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    res.send(`Triggered create case with age: ${req.body.age}`);
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
