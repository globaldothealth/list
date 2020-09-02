import { GeocodeOptions, GeocodeResult, Resolution } from './geocoder';
import Geocoding, {
    GeocodeFeature,
    GeocodeMode,
    GeocodeQueryType,
    GeocodeRequest,
    GeocodeResponse,
    GeocodeService,
} from '@mapbox/mapbox-sdk/services/geocoding';

import LRUCache from 'lru-cache';
import MapboxAdminsFetcher from './adminsFetcher';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

/**
 * getFeatureDescriptionFromContext will return the feature 'text' field if it is of the provided type.
 * The types in the context fields are a prefix of the ID. E.g 'region.foo' will be a feature of type 'region'.
 * @param context: A geocode feature to get the desired type from.
 * @param type: The desired type.
 *
 * @returns the description (text) of the feature with the given type.
 */
function getFeatureDescriptionFromContext(
    context: GeocodeFeature[],
    type: string,
): string {
    for (const f of context) {
        if (f.id.startsWith(type)) {
            return f.text;
        }
    }
    return '';
}

// Gets the finest resolution contained in the features.
function getResolution(features: GeocodeFeature[]): Resolution {
    // IDs contain the type of features in "place.someid" format.
    const types = new Set(
        features.map((f: GeocodeFeature): string =>
            f.id.substring(0, f.id.indexOf('.')),
        ),
    );
    // Go through each type from finest to largest and return the first match.
    if (types.has('poi')) {
        return Resolution.Point;
    } else if (types.has('place')) {
        return Resolution.Admin3;
    } else if (types.has('district')) {
        return Resolution.Admin2;
    } else if (types.has('region')) {
        return Resolution.Admin1;
    }
    return Resolution.Country;
}

// Get the mapbox types for a given Resolution.
const resolutionToGeocodeQueryType = new Map<Resolution, GeocodeQueryType>([
    [Resolution.Country, 'country'],
    [Resolution.Admin1, 'region'],
    [Resolution.Admin2, 'district'],
    [Resolution.Admin3, 'place'],
    [Resolution.Point, 'poi'],
]);

export default class MapboxGeocoder {
    private geocodeService: GeocodeService;
    private cache: LRUCache<string, GeocodeResult[]>;
    private adminsFetcher: MapboxAdminsFetcher;
    constructor(accessToken: string, private readonly endpoint: GeocodeMode) {
        this.geocodeService = Geocoding({
            accessToken: accessToken,
        });
        this.cache = new LRUCache<string, GeocodeResult[]>({
            max: 500,
        });
        this.adminsFetcher = new MapboxAdminsFetcher(accessToken);
    }

    async geocode(
        query: string,
        opts?: GeocodeOptions,
    ): Promise<GeocodeResult[]> {
        query = query.trim();
        const cacheKey = JSON.stringify({
            query: query.toLowerCase(),
            opts: opts,
        });
        const cachedResults = this.cache.get(cacheKey);
        if (cachedResults) {
            return cachedResults;
        }
        try {
            const req: GeocodeRequest = {
                mode: this.endpoint,
                query: query,
                language: ['en'],
                limit: 5,
            };
            // Setting req.type allows to filter the top level results
            // with features of that specific type.
            // The context of the feature can still has other types
            // (if you ask for a region, the context will still contain the country).
            const requestedResolutions = opts?.limitToResolution;
            if (requestedResolutions) {
                const types = requestedResolutions
                    .map((r: Resolution) => resolutionToGeocodeQueryType.get(r))
                    .filter((t) => t);
                if (types) {
                    req.types = [];
                    types.forEach((t: GeocodeQueryType | undefined) => {
                        // They're filtered above, but Typescript can't take
                        // the hint.
                        if (t) {
                            req.types?.push(t);
                        }
                    });
                }
            }
            const resp: MapiResponse = await this.geocodeService
                .forwardGeocode(req)
                .send();
            const features = (resp.body as GeocodeResponse).features;
            const geocodes = await Promise.all(
                features.map(async (feature) => {
                    const contexts: GeocodeFeature[] = [feature];
                    if (feature.context) {
                        contexts.push(...feature.context);
                    }
                    const res: GeocodeResult = {
                        geometry: {
                            longitude: feature.center[0],
                            latitude: feature.center[1],
                        },
                        country: getFeatureDescriptionFromContext(
                            contexts,
                            'country',
                        ),
                        place: getFeatureDescriptionFromContext(
                            contexts,
                            'poi',
                        ),
                        name: feature.place_name,
                        geoResolution: getResolution(contexts),
                    };
                    // Fill in the administrative areas.
                    await this.adminsFetcher.fillAdmins(res);
                    return res;
                }),
            );
            this.cache.set(cacheKey, geocodes);
            return geocodes;
        } catch (e) {
            throw e;
        }
    }
}
