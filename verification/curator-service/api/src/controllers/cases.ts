import { Request, Response } from 'express';

import { Geocoder } from '../geocoding/geocoder';
import axios from 'axios';

/**
 * CasesController forwards requests to the data service.
 * It handles CRUD operations from curators.
 */
export default class CasesController {
    constructor(
        private readonly dataServerURL: string,
        private readonly geocoder: Geocoder,
    ) {}

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };

    get = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };

    del = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.delete(
                this.dataServerURL + '/api' + req.url,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.put(
                this.dataServerURL + '/api' + req.url,
                req.body,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        // TODO: Geocode if no lat/lng provided.
        try {
            const response = await axios.post(
                this.dataServerURL + '/api' + req.url,
                req.body,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    };
}
