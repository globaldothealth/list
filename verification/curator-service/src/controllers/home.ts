import { Request, Response } from 'express';

/**
 * Get the home page.
 *
 * Handles HTTP GET /.
 */
export const index = (req: Request, res: Response): void => {
    res.send('Curator service under construction.');
};
