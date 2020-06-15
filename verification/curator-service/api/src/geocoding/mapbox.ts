import Geocoding, {
    GeocodeMode,
    GeocodeResponse,
    GeocodeService,
} from '@mapbox/mapbox-sdk/services/geocoding';

import { GeocodeResult } from './geocoder';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

export class Geocoder {
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
            console.log('Geocode response:', resp);
            const features = (resp.body as GeocodeResponse).features;
            if (features.length == 0) {
                throw Error('no geocode result');
            }
            return features.map((feature) => {
                return {
                    lng: feature.center[0],
                    lat: feature.center[1],
                };
            });
        } catch (e) {
            console.error('geocoding:', e);
            throw e;
        }
    }
}
