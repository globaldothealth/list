import MapboxAdminsFetcher from '../../src/geocoding/adminsFetcher';
import { Resolution } from '../../src/geocoding/geocoder';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const testToken = 'test-token';

afterEach(() => {
    jest.clearAllMocks();
});

describe('Admins', () => {
    it('are not fetched when not needed', async () => {
        const fetcher = new MapboxAdminsFetcher(testToken);
        await fetcher.fillAdmins({
            administrativeAreaLevel1: 'foo',
            administrativeAreaLevel2: 'bar',
            administrativeAreaLevel3: 'baz',
            country: 'Brasilistan',
            geoResolution: Resolution.Admin3,
            geometry: {
                latitude: 12.34,
                longitude: 45.67,
            },
            name: 'the',
            place: 'to be',
        });
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('fetches missing admins', async () => {
        const fetcher = new MapboxAdminsFetcher(testToken);
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {
                features: [
                    {
                        properties: {
                            id: 'USAFOO',
                            tilequery: {
                                layer: 'boundaries_admin_1',
                            },
                        },
                    },
                    {
                        properties: {
                            id: 'USABAR',
                            tilequery: {
                                layer: 'boundaries_admin_2',
                            },
                        },
                    },
                    {
                        properties: {
                            id: 'USABAR',
                            tilequery: {
                                layer: 'boundaries_admin_3',
                            },
                        },
                    },
                ],
            },
        });
        await fetcher.fillAdmins({
            administrativeAreaLevel1: '',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: '',
            country: 'Brasilistan',
            geoResolution: Resolution.Country,
            geometry: {
                latitude: 12.34,
                longitude: 45.67,
            },
            name: 'the',
            place: 'to be',
        });
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://api.mapbox.com/v4/mapbox.enterprise-boundaries-a1-v2,mapbox.enterprise-boundaries-a2-v2,mapbox.enterprise-boundaries-a3-v2/tilequery/45.67,12.34.json?access_token=test-token',
        );
    });
});
