import * as baseUser from './users/base.json';

import { GeocodeResult, Resolution } from '../src/geocoding/geocoder';
import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import axios from 'axios';
import supertest from 'supertest';

const caseReference = {
    caseReference: {
        sourceId: '5ea86423bae6982635d2e1f8',
        sourceEntryId: 'abc',
        sourceUrl: 'cdc.gov',
    },
};

const creatorMetadata = {
    curator: {
        email: 'foo@bar.com',
    },
};

const minimalCreateRequest = {
    ...caseReference,
    ...creatorMetadata,
    events: [
        {
            name: 'confirmed',
            dateRange: {
                start: '2019-12-03T14:07:03.382Z',
                end: '2019-12-03T14:07:03.382Z',
            },
        },
    ],
    location: {
        query: 'Canada',
    },
};

const mockInitialize = jest.fn().mockResolvedValue({});
jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: mockInitialize };
    });
});

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
let mongoServer: MongoMemoryServer;

afterEach(() => {
    jest.clearAllMocks();
});

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

afterAll(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

describe('Cases', () => {
    let curatorRequest: any;
    beforeEach(async () => {
        curatorRequest = supertest.agent(app);
        await curatorRequest
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator'] } })
            .expect(200);
    });
    afterEach(async () => {
        await curatorRequest.post('/api/geocode/clear').expect(200);
    });
    it('proxies list calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: { cases: [] },
        });
        await curatorRequest
            .get('/api/cases?limit=10&page=1&q=cough')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases?limit=10&page=1&q=cough',
        );
    });

    it('proxies list symptoms calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: { cases: [] },
        });
        await curatorRequest
            .get('/api/cases/symptoms?limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/symptoms?limit=10',
        );
    });

    it('proxies list places of transmission calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: { cases: [] },
        });
        await curatorRequest
            .get('/api/cases/placesOfTransmission?limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/placesOfTransmission?limit=10',
        );
    });

    it('proxies list occupations calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: { cases: [] },
        });
        await curatorRequest
            .get('/api/cases/occupations?limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/occupations?limit=10',
        );
    });

    it('list maintains error data from proxied call if available', async () => {
        const code = 404;
        const message = 'Not found';
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .get('/api/cases?limit=10&page=1&q=')
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('proxies get calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {},
        });
        await curatorRequest
            .get('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
        );
    });

    it('get maintains error data from proxied call if available', async () => {
        const code = 404;
        const message = 'Not found';
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .get('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('proxies update calls', async () => {
        mockedAxios.put.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {},
        });
        await curatorRequest
            .put('/api/cases/5e99f21a1c9d440000ceb088')
            .send({ age: '42' })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(
            mockedAxios.put,
        ).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
            { age: '42', ...creatorMetadata },
        );
    });

    it('update maintains error data from proxied call if available', async () => {
        const code = 404;
        const message = 'Not found';
        mockedAxios.put.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .put('/api/cases/5e99f21a1c9d440000ceb088')
            .send({ age: '42' })
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('proxies delete calls', async () => {
        mockedAxios.delete.mockResolvedValueOnce({
            status: 204,
            statusText: 'Case deleted',
        });
        await curatorRequest
            .delete('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(204);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
        );
    });

    it('delete maintains error data from proxied call if available', async () => {
        const code = 404;
        const message = 'Not found';
        mockedAxios.delete.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .delete('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('proxies delete many calls', async () => {
        mockedAxios.delete.mockResolvedValueOnce({
            status: 204,
            statusText: 'Cases deleted',
        });
        await curatorRequest
            .delete('/api/cases')
            .send({ caseIds: ['5e99f21a1c9d440000ceb088'] })
            .expect(204);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                data: {
                    caseIds: ['5e99f21a1c9d440000ceb088'],
                    maxCasesThreshold: 10000,
                },
            },
        );
    });

    it('does not set maxCasesThreshold for admins', async () => {
        mockedAxios.delete.mockResolvedValueOnce({
            status: 204,
            statusText: 'Cases deleted',
        });
        const adminRequest = supertest.agent(app);
        await adminRequest
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator', 'admin'] } })
            .expect(200);
        await adminRequest
            .delete('/api/cases')
            .send({ caseIds: ['5e99f21a1c9d440000ceb088'] })
            .expect(204);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                data: {
                    caseIds: ['5e99f21a1c9d440000ceb088'],
                },
            },
        );
    });

    it('delete many maintains error data from proxied call if available', async () => {
        const code = 500;
        const message = 'Internal Server Error';
        mockedAxios.delete.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .delete('/api/cases')
            .send({ caseIds: ['5e99f21a1c9d440000ceb088'] })
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('proxies upsert calls and geocodes', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.put.mockResolvedValueOnce({
            status: 201,
            statusText: 'Created',
            data: {},
        });
        await curatorRequest
            .put('/api/cases')
            .send({ age: '42', location: { query: 'Lyon' }, ...caseReference })
            .expect(201)
            .expect('Content-Type', /json/);

        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                age: '42',
                location: lyon,
                ...creatorMetadata,
                ...caseReference,
            },
        );
    });

    it('upsert maintains error data from proxied call if available', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);

        const code = 404;
        const message = 'Not found';
        mockedAxios.put.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .put('/api/cases')
            .send({ age: '42', location: { query: 'Lyon' }, ...caseReference })
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('proxies valid batch upsert calls', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post
            .mockResolvedValueOnce({
                status: 207,
                data: { errors: [] },
            })
            .mockResolvedValueOnce({
                status: 207,
                data: {
                    numCreated: 2,
                    numUpdated: 0,
                },
            });
        const res = await curatorRequest
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    {
                        age: '42',
                        location: { query: 'Lyon' },
                    },
                    {
                        age: '42',
                        location: { query: 'Lyon' },
                    },
                ],
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(res.body.phase).toBe('UPSERT');
        expect(res.body.numCreated).toBe(2);
        expect(res.body.numUpdated).toBe(0);
        expect(res.body.errors).toHaveLength(0);
    });

    it('batch upsert returns all geocoding issues', async () => {
        const miami: GeocodeResult = {
            administrativeAreaLevel1: 'Florida',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Miami',
            country: 'United States',
            geometry: { latitude: 25.7617, longitude: -80.192 },
            place: '',
            name: 'Miami',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(miami).expect(200);
        const res = await curatorRequest
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    {
                        age: '42',
                        location: { query: 'Miami' },
                    },
                    {
                        age: '42',
                        location: {},
                    },
                    {
                        age: '42',
                        location: { query: 'Lyon' },
                    },
                ],
            })
            .expect(207)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).not.toHaveBeenCalled();
        expect(mockedAxios.put).not.toHaveBeenCalled();
        expect(res.body.phase).toBe('GEOCODE');
        expect(res.body.numCreated).toBe(0);
        expect(res.body.numUpdated).toBe(0);
        expect(res.body.errors).toEqual([
            {
                index: 1,
                message:
                    'location.query must be specified to be able to geocode',
            },
            { index: 2, message: 'no geolocation found for Lyon' },
        ]);
    });

    it('batch upsert returns all validation issues', async () => {
        const miami: GeocodeResult = {
            administrativeAreaLevel1: 'Florida',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Miami',
            country: 'United States',
            geometry: { latitude: 25.7617, longitude: -80.192 },
            place: '',
            name: 'Miami',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(miami).expect(200);
        const validationErrors = [
            { index: 1, message: 'Oops!' },
            { index: 2, message: 'Darn!' },
        ];
        mockedAxios.post.mockResolvedValueOnce({
            status: 207,
            data: { errors: validationErrors },
        });
        const res = await curatorRequest
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    {
                        age: '42',
                        location: { query: 'Miami' },
                    },
                    {
                        age: '42',
                        location: { query: 'Miami' },
                    },
                    {
                        age: '42',
                        location: { query: 'Miami' },
                    },
                ],
            })
            .expect(207)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).not.toHaveBeenCalled();
        expect(res.body.phase).toBe('VALIDATE');
        expect(res.body.numCreated).toBe(0);
        expect(res.body.numUpdated).toBe(0);
        expect(res.body.errors).toEqual(validationErrors);
    });

    it('batch upsert forwards server errors from proxied upsert', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        const code = 500;
        const message = 'Server error';
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post
            .mockResolvedValueOnce({
                status: 207,
                data: { errors: [] },
            })
            .mockRejectedValueOnce({
                response: { status: code, data: message },
            });

        const res = await curatorRequest
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    {
                        age: '42',
                        location: { query: 'Lyon' },
                    },
                    {
                        age: '42',
                        location: { query: 'Lyon' },
                    },
                ],
            })
            .expect(code);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(res.text).toEqual(message);
    });

    it('proxies valid batch update calls', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            data: { numModified: 2 },
        });
        const res = await curatorRequest
            .post('/api/cases/batchUpdate')
            .send({
                cases: [
                    {
                        age: '42',
                    },
                    {
                        age: '42',
                    },
                ],
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(res.body.numModified).toEqual(2);
    });

    it('batch update forwards server errors from proxied update', async () => {
        const code = 500;
        const message = 'Server error';
        mockedAxios.post.mockRejectedValueOnce({
            response: { status: code, data: message },
        });

        const res = await curatorRequest
            .post('/api/cases/batchUpdate')
            .send({
                cases: [
                    {
                        age: '42',
                    },
                    {
                        age: '42',
                    },
                ],
            })
            .expect(code);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(res.text).toEqual(message);
    });

    it('proxies valid batch update query calls', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            data: { numModified: 2 },
        });
        const res = await curatorRequest
            .post('/api/cases/batchUpdateQuery')
            .send({
                case: {
                    age: '42',
                },
                query: 'test case',
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(res.body.numModified).toEqual(2);
    });

    it('batch update query forwards server errors from proxied update', async () => {
        const code = 500;
        const message = 'Server error';
        mockedAxios.post.mockRejectedValueOnce({
            response: { status: code, data: message },
        });

        const res = await curatorRequest
            .post('/api/cases/batchUpdateQuery')
            .send({
                case: {
                    age: '42',
                },
                query: 'test case',
            })
            .expect(code);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(res.text).toEqual(message);
    });

    it('proxies create calls and geocode', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            statusText: 'Created',
            data: {},
        });
        await curatorRequest
            .post('/api/cases')
            .send({
                ...minimalCreateRequest,
                location: { query: 'Lyon', limitToResolution: 'Admin3' },
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                ...minimalCreateRequest,
                location: lyon,
            },
        );
    });

    it('proxies create multiple cases calls and geocode', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            statusText: 'Created',
            data: {},
        });
        await curatorRequest
            .post('/api/cases?num_cases=3')
            .send({
                ...minimalCreateRequest,
                location: { query: 'Lyon', limitToResolution: 'Admin3' },
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases?num_cases=3',
            {
                ...minimalCreateRequest,
                location: lyon,
            },
        );
    });

    it('proxies create calls when bypassing geocoding', async () => {
        const lyon = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            statusText: 'Created',
            data: {},
        });
        await curatorRequest
            .post('/api/cases')
            .send({
                ...minimalCreateRequest,
                location: lyon,
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                ...minimalCreateRequest,
                location: lyon,
            },
        );
    });

    it('create maintains error data from proxied call if available', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);

        const code = 404;
        const message = 'Not found';
        mockedAxios.post.mockRejectedValueOnce({
            response: { status: code, data: message },
        });
        const res = await curatorRequest
            .post('/api/cases')
            .send({
                ...minimalCreateRequest,
                location: { query: 'Lyon', limitToResolution: 'Admin3' },
            })
            .expect(code);
        expect(res.text).toEqual(message);
    });

    it('handles multiple location restrictions', async () => {
        const lyon: GeocodeResult = {
            administrativeAreaLevel1: 'Rhône',
            administrativeAreaLevel2: '',
            administrativeAreaLevel3: 'Lyon',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            place: '',
            name: 'Lyon',
            geoResolution: Resolution.Admin3,
        };
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            statusText: 'Created',
            data: {},
        });

        await curatorRequest
            .post('/api/cases')
            .send({
                ...minimalCreateRequest,
                location: {
                    query: 'Lyon',
                    limitToResolution: 'Admin3,Admin2',
                },
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                ...minimalCreateRequest,
                location: lyon,
                ...creatorMetadata,
            },
        );
    });

    it('throws on invalid location restrictions', async () => {
        await curatorRequest
            .post('/api/cases')
            .send({
                ...minimalCreateRequest,
                location: {
                    query: 'Lyon',
                    limitToResolution: 'NotAResolution',
                },
            })
            .expect(422);
    });

    it('returns 404 when no geocode could be found on create', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            statusText: 'Created',
            data: {},
        });
        await curatorRequest
            .post('/api/cases')
            .send({
                ...minimalCreateRequest,
                location: { query: 'Lyon' },
            })
            .expect(404);
    });
});
