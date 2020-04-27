import { Request, Response } from 'express';
import axios from 'axios';

export interface Case {
    _id: string;
    outcome: string;
    date: Date;
}

/**
 * List linelist case data from dataserver.
 *
 * Handles HTTP GET /api/cases.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await axios.get<Case[]>('/cases');
        const cases = response.data;
        res.json(cases);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};
