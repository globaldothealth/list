import { Request, Response } from 'express';
import axios from 'axios';

interface Case {
    _id: string;
    outcome: string;
    date: Date;
}

function getLatestCaseDate(cases: [Case]): Date {
    return cases.reduce((case1, case2) =>
        // These casts are required.
        // JSON deserialization doesn't add functions to the object.
        new Date(case1.date).getTime() > new Date(case2.date).getTime()
            ? case1
            : case2,
    ).date;
}

/**
 * Get the home page.
 *
 * Handles HTTP GET /.
 */
export const index = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await axios.get<[Case]>('/cases');
        const cases = response.data;
        const latestDate = getLatestCaseDate(cases);
        res.send(
            `Found ${cases.length} cases (latest case date: ${latestDate}).`,
        );
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};
