import * as baseUser from './users/base.json';

import { GeocodeResult, Resolution } from '../src/geocoding/geocoder';
import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import axios from 'axios';
import supertest from 'supertest';

const creatorMetadata = {
    curator: {
        email: 'foo@bar.com',
    },
};

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
            .send({ ...baseUser, ...{ roles: ['reader', 'curator'] } })
            .expect(200);
    });
    afterEach(async () => {
        await curatorRequest.post('/api/geocode/clear').expect(200);
    });
    it('denies access to non readers', async () => {
        return supertest
            .agent(app)
            .get('/api/cases?limit=10&page=1&q=')
            .expect(403, /reader/)
            .expect('Content-Type', /json/);
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
            .send({ age: '42', location: { query: 'Lyon' } })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                age: '42',
                location: lyon,
                ...creatorMetadata,
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
            .send({ age: '42', location: { query: 'Lyon' } })
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
        mockedAxios.post.mockResolvedValueOnce({
            status: 207,
            data: { errors: [] },
        });
        mockedAxios.put.mockResolvedValueOnce({ status: 200 });
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
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(2);
        expect(res.body.numUpserted).toBe(2);
        expect(res.body.numErrors).toBe(0);
        expect(res.body.phase).toBe('UPSERT');
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
        expect(res.body.numUpserted).toBe(0);
        expect(res.body.numErrors).toBe(2);
        expect(res.body.phase).toBe('GEOCODE');
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
        expect(res.body.numUpserted).toBe(0);
        expect(res.body.numErrors).toBe(2);
        expect(res.body.phase).toBe('VALIDATE');
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
        await curatorRequest.post('/api/geocode/seed').send(lyon).expect(200);
        mockedAxios.post.mockResolvedValueOnce({
            status: 207,
            data: { errors: [] },
        });

        const code = 500;
        const message = 'Server error';
        mockedAxios.put.mockRejectedValueOnce({
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
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
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
                age: '42',
                location: { query: 'Lyon', limitToResolution: 'Admin3' },
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                age: '42',
                location: lyon,
                ...creatorMetadata,
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
                age: '42',
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
                age: '42',
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
                age: '42',
                location: lyon,
                ...creatorMetadata,
            },
        );
    });

    it('throws on invalid location restrictions', async () => {
        await curatorRequest
            .post('/api/cases')
            .send({
                age: '42',
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
            .send({ age: '42', location: { query: 'Lyon' } })
            .expect(404);
    });
});
