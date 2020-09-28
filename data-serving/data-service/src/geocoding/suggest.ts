import { Request, Response } from 'express';

import { GeocodeOptions, Geocoder, Resolution } from './geocoder';

/**
 * GeocodeSuggester can be used to suggest GeocodeResults based on a provided
 * list of geocoders.
 * This is useful to build an autocomplete search box of locations for example.
 */
export default class GeocodeSuggester {
    constructor(private readonly geocoders: Geocoder[]) {}

    /**
     * Suggest will try to geocode the given req.query.q with all available
     * geocoders and will return as soon as at least a result is returned from
     * a geocoder.
     * If a geocoder errors, no further attempts will be made and an error 500
     * will be returned.
     * If no results are found, an empty array is returned.
     */
    suggest = async (req: Request, res: Response): Promise<void> => {
        if (req.query.q) {
            try {
                const opts: GeocodeOptions = {};
                if (req.query['limitToResolution']) {
                    opts.limitToResolution = [];
                    (req.query['limitToResolution'] as string)
                        .split(',')
                        .forEach((supplied: string) => {
                            const resolution =
                                Resolution[supplied as keyof typeof Resolution];
                            if (!resolution) {
                                throw new Error(
                                    `invalid limitToResolution: ${supplied}`,
                                );
                            }
                            opts.limitToResolution?.push(resolution);
                        });
                }
                for (const geocoder of this.geocoders) {
                    const suggestions = await geocoder.geocode(
                        req.query.q.toString(),
                        opts,
                    );
                    if (suggestions.length > 0) {
                        res.json(suggestions);
                        return;
                    }
                }
            } catch (e) {
                res.status(500).send(e);
            }
        }
        res.json([]);
    };
}
