import { Request, Response } from 'express';

import { GeocodeResult } from './geocoder';

export default class FakeGeocoder {
    private entries: Map<string, GeocodeResult>;

    constructor() {
        this.entries = new Map<string, GeocodeResult>();
    }
    async geocode(query: string): Promise<GeocodeResult[]> {
        const entry = this.entries.get(query);
        return entry ? [entry] : [];
    }

    seed = (req: Request, res: Response): void => {
        const body = req.body as GeocodeResult;
        this.entries.set(body.text, body);
        res.sendStatus(200);
    };

    clear = (req: Request, res: Response): void => {
        this.entries.clear();
        res.sendStatus(200);
    };
}
