import { Request, Response } from 'express';
import axios from 'axios';

/** Dumb proxy to geocoder in data service */
export default class GeocodeProxy {
    constructor(private readonly dataServerURL: string) {}

    suggest = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
            return;
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    seed = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.dataServerURL + '/api' + req.url,
            req.body,
        );
        res.status(response.status).send();
    };

    clear = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.dataServerURL + '/api' + req.url,
            req.body,
        );
        res.status(response.status).send();
    };
}
