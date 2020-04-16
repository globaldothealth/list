import { Request, Response } from "express";

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
    res.send('Triggered listCases API.');
};