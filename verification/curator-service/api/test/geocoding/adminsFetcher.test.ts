import { GeocodeResult, Resolution } from '../../src/geocoding/geocoder';

import { Admin } from '../../src/model/admin';
import MapboxAdminsFetcher from '../../src/geocoding/adminsFetcher';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';
import mongoose from 'mongoose';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const testToken = 'test-token';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    await mongoose.connect(await mongoServer.getUri(), {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });
});

afterEach(() => {
    jest.clearAllMocks();
});

beforeEach(async () => {
    await Admin.deleteMany({});
});

afterAll(async () => {
    await Admin.deleteMany({});
    mongoose.disconnect();
    return mongoServer.stop();
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
        await Admin.insertMany([
            { id: 'USAFOO', name: 'some admin 1' },
            { id: 'USABAR', name: 'some admin 2' },
            { id: 'USABAZ', name: 'some admin 3' },
        ]);
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
                            id: 'USABAZ',
                            tilequery: {
                                layer: 'boundaries_admin_3',
                            },
                        },
                    },
                ],
            },
        });
        const geocode: GeocodeResult = {
            administrativeAreaLevel1: '',
            administrativeAreaLevel2: '',
            country: 'Brasilistan',
            geoResolution: Resolution.Country,
            geometry: {
                latitude: 12.34,
                longitude: 45.67,
            },
            name: 'the',
            place: 'to be',
        };
        await fetcher.fillAdmins(geocode);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://api.mapbox.com/v4/mapbox.enterprise-boundaries-a1-v2,mapbox.enterprise-boundaries-a2-v2,mapbox.enterprise-boundaries-a3-v2/tilequery/45.67,12.34.json?access_token=test-token',
        );
        expect(geocode.administrativeAreaLevel1).toBe('some admin 1');
        expect(geocode.administrativeAreaLevel2).toBe('some admin 2');
        expect(geocode.administrativeAreaLevel3).toBe('some admin 3');
        // Call again, cache should be hit.
        geocode.administrativeAreaLevel1 = '';
        geocode.administrativeAreaLevel2 = '';
        geocode.administrativeAreaLevel3 = '';
        await fetcher.fillAdmins(geocode);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('ignores missing admins names', async () => {
        await Admin.insertMany([{ id: 'USAFOO', name: 'some admin 1' }]);
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
                ],
            },
        });
        const geocode: GeocodeResult = {
            country: 'Brasilistan',
            geoResolution: Resolution.Country,
            geometry: {
                latitude: 12.34,
                longitude: 45.67,
            },
            name: 'the second',
            place: 'to be',
        };
        await fetcher.fillAdmins(geocode);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://api.mapbox.com/v4/mapbox.enterprise-boundaries-a1-v2,mapbox.enterprise-boundaries-a2-v2,mapbox.enterprise-boundaries-a3-v2/tilequery/45.67,12.34.json?access_token=test-token',
        );
        expect(geocode.administrativeAreaLevel1).toBe('some admin 1');
        expect(geocode.administrativeAreaLevel2).toBeUndefined();
        expect(geocode.administrativeAreaLevel3).toBeUndefined();
    });
});
