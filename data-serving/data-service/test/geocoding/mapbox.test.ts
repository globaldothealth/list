import * as lyon from './lyon.json';

import { GeocodeResult, Resolution } from '../../src/geocoding/geocoder';

import Geocoder from '../../src/geocoding/mapbox';
import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import axios from 'axios';
import { RateLimiter } from 'limiter';

// Typings defined by DefinitelyTyped are not fully compatible with the response we get.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const features: any[] = [];
let callCount = 0;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    features.splice(0, features.length);
    callCount = 0;
});

describe('geocode', () => {
    it('succeeds', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {
                features: [],
            },
        });
        features.push(lyon);
        const geocoder = new Geocoder(
            'token',
            'mapbox.places',
            new RateLimiter(100, 'second'),
        );
        let feats = await geocoder.geocode('some query', {
            limitToResolution: [Resolution.Admin3, Resolution.Admin2],
        });
        expect(feats).toHaveLength(1);
        const wantFeature: GeocodeResult = {
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon, Rhône, France',
            geoResolution: Resolution.Admin3,
        };
        expect(feats[0]).toEqual(wantFeature);
        expect(callCount).toBe(1);
        // Call again, cache should have been hit.
        feats = await geocoder.geocode('some query', {
            limitToResolution: [Resolution.Admin3, Resolution.Admin2],
        });
        expect(feats[0]).toEqual(wantFeature);
        expect(callCount).toBe(1);
    });
    it('can return no results', async () => {
        const geocoder = new Geocoder(
            'token',
            'mapbox.places',
            new RateLimiter(100, 'second'),
        );
        const feats = await geocoder.geocode('some query');
        expect(feats).toHaveLength(0);
    });
});
