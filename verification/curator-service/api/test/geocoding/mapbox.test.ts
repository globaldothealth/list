import * as lyon from './lyon.json';

import { GeocodeResult } from '../../src/geocoding/geocoder';
import Geocoder from '../../src/geocoding/mapbox';
import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

// Typings defined by DefinitelyTyped are not fully compatible with the response we get.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const features: any[] = [];

jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
    return jest.fn().mockImplementation(() => {
        return {
            forwardGeocode: (): MapiRequest => {
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
});

describe('geocode', () => {
    it('succeeds', async () => {
        features.push(lyon);
        const geocoder = new Geocoder('token', 'mapbox.places');
        const feats = await geocoder.geocode('some query');
        expect(feats).toHaveLength(1);
        expect(feats[0]).toEqual({
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: 'Admin3',
        });
    });
    it('can return no results', async () => {
        const geocoder = new Geocoder('token', 'mapbox.places');
        const feats = await geocoder.geocode('some query');
        expect(feats).toHaveLength(0);
    });
});
