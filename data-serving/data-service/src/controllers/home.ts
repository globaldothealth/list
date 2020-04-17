import { Request, Response } from 'express';

/**
 * Get the home page.
 *
 * Handles HTTP GET /.
 */
export const index = (req: Request, res: Response) => {
    res.send('Data service under construction.');
};
