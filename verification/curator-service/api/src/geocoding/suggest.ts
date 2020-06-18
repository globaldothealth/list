import { Request, Response } from 'express';

import { Geocoder } from './geocoder';

export default class GeocodeSuggester {
    constructor(private readonly geocoders: Geocoder[]) {}

    suggest = async (req: Request, res: Response): Promise<void> => {
        try {
            for (const geocoder of this.geocoders) {
                const suggestions = await geocoder.geocode(
                    req.query.q.toString(),
                );
                if (suggestions.length > 0) {
                    res.json(suggestions);
                    return;
                }
            }
        } catch (e) {
            res.status(500).send(e.message);
        }
        res.json([]);
    };
}
