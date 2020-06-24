import { GeocodeOptions, Geocoder, Resolution } from '../geocoding/geocoder';
import { Request, Response } from 'express';

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

    upsert = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!(await this.geocode(req))) {
                res.status(404).send(
                    `no geolocation found for ${req.body['location']?.query}`,
                );
                return;
            }
            const response = await axios.put(
                this.dataServerURL + '/api' + req.url,
                req.body,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err.message);
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!(await this.geocode(req))) {
                res.status(404).send(
                    `no geolocation found for ${req.body['location']?.query}`,
                );
                return;
            }
            const response = await axios.post(
                this.dataServerURL + '/api' + req.url,
                req.body,
            );
            res.json(response.data);
        } catch (err) {
            console.log(err);
            res.status(500).send(err.message);
        }
    };

    /**
     * Geocodes request content if no lat lng were provided.
     *
     * @returns {boolean} Whether lat lng were either provided or geocoded
     */
    private async geocode(req: Request): Promise<boolean> {
        // Geocode query if no lat lng were provided.
        const location = req.body['location'];
        if (!location?.geometry?.latitude || !location.geometry?.longitude) {
            for (const geocoder of this.geocoders) {
                const opts: GeocodeOptions = {};
                if (location['limitToResolution']) {
                    opts.limitToResolution =
                        Resolution[
                            location[
                                'limitToResolution'
                            ] as keyof typeof Resolution
                        ];
                }
                const features = await geocoder.geocode(location?.query, opts);
                if (features.length === 0) {
                    continue;
                }
                // Currently a 1:1 match between the GeocodeResult and the data service API.
                req.body['location'] = features[0];
                return true;
            }
            return false;
        } else {
            // Remove any left over field as the schema doesn't allow unknown fields.
            delete location.query;
            delete location.limitToResolution;
        }
        return true;
    }
}
