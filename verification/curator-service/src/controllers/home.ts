import { Request, Response } from 'express';
import axios from 'axios';

interface Case {
    _id: string;
    outcome: string;
    date: Date;
}

function getLatestCaseDate(cases: [Case]): Date {
    cases.sort((case1, case2) => {
        const time1 = case1.date.getTime();
        const time2 = case2.date.getTime();
        if (time1 > time2) return 1;
        if (time1 < time2) return -1;
        return 0;
    });
    return cases[cases.length - 1].date;
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
        res.status(500).send(err);
    }
};
