import { Request, Response } from 'express';

import axios, { AxiosError } from 'axios';
import { logger } from '../util/logger';

/** Dumb proxy to geocoder in data service */
export default class GeocodeProxy {
    constructor(private readonly locationServiceURL: string) {}

    suggest = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.locationServiceURL + req.url,
            );
            res.status(response.status).json(response.data);
            return;
        } catch (err) {
            logger.error(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    convertUTM = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.locationServiceURL + req.url,
            );
            res.status(response.status).json(response.data);
            return;
        } catch (err) {
            logger.error(err as Error);
            if (axios.isAxiosError(err)) {
                res.status(err.response!.status).send(err.response!.data);
                return;
            }
        }
    }
    seed = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.locationServiceURL + req.url,
            req.body,
        );
        res.status(response.status).send();
    };

    clear = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.locationServiceURL + req.url,
            req.body,
        );
        res.status(response.status).send();
    };
}
