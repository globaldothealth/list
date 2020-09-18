import { Request, Response } from 'express';

import { GeocodeResult } from './geocoder';

/**
 * Fake geocoder used in integration tests (or locally if you want to).
 */
export default class FakeGeocoder {
    private entries: Map<string, GeocodeResult>;

    constructor() {
        this.entries = new Map<string, GeocodeResult>();
    }
    /**
     * Geocode with fake seeded locations.
     * It ignores the options that can be passed to the geocoder and
     * matches locations' name field with the given query.
     */
    async geocode(query: string): Promise<GeocodeResult[]> {
        const entry = this.entries.get(query);
        return entry ? [entry] : [];
    }

    /**
     * Seeds a geocode result based on the GeocodeResult passed in the request body.
     */
    seed = (req: Request, res: Response): void => {
        const body = req.body as GeocodeResult;
        this.entries.set(body.name, body);
        res.sendStatus(200);
    };

    /**
     * Clears all seeded entries.
     */
    clear = (req: Request, res: Response): void => {
        this.entries.clear();
        res.sendStatus(200);
    };
}
