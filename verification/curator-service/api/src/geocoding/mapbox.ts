import Geocoding, {
    GeocodeFeature,
    GeocodeMode,
    GeocodeResponse,
    GeocodeService,
} from '@mapbox/mapbox-sdk/services/geocoding';

import { GeocodeResult } from './geocoder';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

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
            const resp: MapiResponse = await this.geocodeService
                .forwardGeocode({
                    mode: this.endpoint,
                    query: query,
                    language: ['en'],
                    limit: 5,
                })
                .send();
            const features = (resp.body as GeocodeResponse).features;
            if (features.length == 0) {
                return [];
            }
            return features.map((feature) => {
                return {
                    geometry: {
                        longitude: feature.center[0],
                        latitude: feature.center[1],
                    },
                    administrativeAreaLevel1: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'region',
                    ),
                    administrativeAreaLevel2: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'district',
                    ),
                    country: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'country',
                    ),
                    locality: getFeatureTypeFromContext(
                        [feature, ...feature.context],
                        'locality',
                    ),
                    text: feature.text,
                };
            });
        } catch (e) {
            throw e;
        }
    }
}
