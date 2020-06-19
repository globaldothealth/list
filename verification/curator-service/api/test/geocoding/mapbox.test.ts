import * as lyon from './lyon.json';

import { GeocodeResult, Resolution } from '../../src/geocoding/geocoder';

import Geocoder from '../../src/geocoding/mapbox';
import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

// Typings defined by DefinitelyTyped are not fully compatible with the response we get.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const features: any[] = [];
let callCount = 0;

jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
    return jest.fn().mockImplementation(() => {
        return {
            forwardGeocode: (): MapiRequest => {
                callCount++;
                return {
                    send: (): Promise<MapiResponse> => {
                        return new Promise<MapiResponse>((resolve) =>
                            resolve({
                                body: {
                                    features: features as GeocodeResult[],
                                },
                            } as MapiResponse),
                        );
                    },
                } as MapiRequest;
            },
        };
    });
});

beforeEach(() => {
    jest.clearAllMocks();
    features.splice(0);
    callCount = 0;
});

describe('geocode', () => {
    it('succeeds', async () => {
        features.push(lyon);
        const geocoder = new Geocoder('token', 'mapbox.places');
        let feats = await geocoder.geocode('some query');
        expect(feats).toHaveLength(1);
        const wantFeature: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        expect(feats[0]).toEqual(wantFeature);
        expect(callCount).toBe(1);
        // Call again, cache should have been hit.
        feats = await geocoder.geocode('some query');
        expect(feats[0]).toEqual(wantFeature);
        expect(callCount).toBe(1);
    });
    it('can return no results', async () => {
        const geocoder = new Geocoder('token', 'mapbox.places');
        const feats = await geocoder.geocode('some query');
        expect(feats).toHaveLength(0);
    });
});
