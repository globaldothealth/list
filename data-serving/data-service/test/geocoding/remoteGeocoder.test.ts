import { GeocodeResult, Resolution } from '../../src/geocoding/geocoder';

import Geocoder from '../../src/geocoding/remoteGeocoder';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('remote geocoder', () => {
    it('calls the geocoding service', async () => {
        const expectedResponse = ['some', 'geocoding', 'results'];
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: expectedResponse,
        });
        const geocoder = new Geocoder('https://example.com/location-service');
        const response = await geocoder.geocode('22 Acacia Avenue', {
            limitToCountry: ['UK'],
            limitToResolution: [Resolution.Admin1],
        });
        expect(mockedAxios.get).toBeCalledWith(
            'https://example.com/location-service/geocode',
            {
                params: {
                    q: '22 Acacia Avenue',
                    limitToCountry: ['UK'],
                    limitToResolution: [Resolution.Admin1],
                },
            },
        );
        expect(response).toEqual(expectedResponse);
    });
});
