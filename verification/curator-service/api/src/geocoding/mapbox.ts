import Geocoding, {
    GeocodeFeature,
    GeocodeMode,
    GeocodeResponse,
    GeocodeService,
} from '@mapbox/mapbox-sdk/services/geocoding';

import { GeocodeResult } from './geocoder';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

// getFeatureTypeFromContext will return the feature 'text' field if it is of the provided type.
// The types in the context fields are a prefix of the ID. E.g 'region.foo' will be a feature of type 'region'.
function getFeatureTypeFromContext(
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

export default class MapboxGeocoder {
    private geocodeService: GeocodeService;
    constructor(accessToken: string, private readonly endpoint: GeocodeMode) {
        this.geocodeService = Geocoding({
            accessToken: accessToken,
        });
    }

    async geocode(query: string): Promise<GeocodeResult[]> {
        try {
            // TODO: Add LRU cache.
            const resp: MapiResponse = await this.geocodeService
                .forwardGeocode({
                    mode: this.endpoint,
                    query: query,
                    language: ['en'],
                    limit: 5,
                })
                .send();
            const features = (resp.body as GeocodeResponse).features;
            return features.map((feature) => {
                return {
                    geometry: {
                        longitude: feature.center[0],
                        latitude: feature.center[1],
                    },
                    country: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'country',
                    ),
                    administrativeAreaLevel1: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'region',
                    ),
                    administrativeAreaLevel2: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'district',
                    ),
                    administrativeAreaLevel3: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'place',
                    ),
                    place: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'poi',
                    ),
                    name: feature.text,
                };
            });
        } catch (e) {
            throw e;
        }
    }
}
