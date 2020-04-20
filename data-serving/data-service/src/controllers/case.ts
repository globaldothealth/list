import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';

/**
 * Get a specific case.
 *
 * Handles HTTP GET /cases/:id.
 */
export const getCase = (req: Request, res: Response) => {
    res.send(`Triggered get case with ID ${req.params.id}.`);
};

/**
 * List all cases.
 *
 * Handles HTTP GET /cases.
 */
export const listCases = (req: Request, res: Response) => {
    res.send('Triggered list cases.');
};

/**
 * Create a case.
 *
 * Handles HTTP POST /cases.
 *
 * For now, just attempts to parse an "age" field and return it in the response.
 * Returns 422 if "age" isn't present int he request body.
 */
export const createCase = async (req: Request, res: Response) => {
    await check('age', 'Age must be a valid number')
        .not()
        .isEmpty()
        .isNumeric()
        .run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    res.send(`Triggered create case with age: ${req.body.age}`);
};
