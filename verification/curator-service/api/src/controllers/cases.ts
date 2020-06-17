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
        private readonly geocoders: Geocoder[],
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
        // Geocode query if no lat lng were provided.
        const location = req.body['location'];
        if (!location?.geometry?.lat || !location.geometry?.lng) {
            let geocodeSuccess = false;
            for (const geocoder of this.geocoders) {
                const features = await geocoder.geocode(location?.query);
                if (features.length === 0) {
                    continue;
                }
                // Currently a 1:1 match between the GeocodeResult and the data service API.
                req.body['location'] = features[0];
                geocodeSuccess = true;
                break;
            }
            if (!geocodeSuccess) {
                res.status(404).send(
                    `no geolocation found for ${location?.query}`,
                );
                return;
            }
        }
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
