import * as baseUser from './users/base.json';

import { MongoMemoryServer } from 'mongodb-memory-server';
import makeApp from '../src/index';
import axios from 'axios';
import db from '../src/model/database';
import supertest from 'supertest';

jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: jest.fn().mockResolvedValue({}) };
    });
});

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
let mongoServer: MongoMemoryServer;

afterEach(() => {
    jest.clearAllMocks();
});

let app: any;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    app = await makeApp();
});

afterAll(async () => {
    await mongoServer.stop();
});

describe('Geocode', () => {
    let curatorRequest: any;
    beforeEach(async () => {
        curatorRequest = supertest.agent(app);
        await curatorRequest
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator'] } })
            .expect(200);
    });
    it('proxies suggest calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: [],
        });
        await curatorRequest
            .get('/api/geocode/suggest?q=Lyon')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://location/geocode/suggest?q=Lyon',
        );
    });
    it('proxies convert calls', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {
                latitude: 0.0,
                longitude: 0.0,
            },
        });
        await curatorRequest
            .get('/api/geocode/convertUTM?n=12&e=7&z=3')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://location/geocode/convertUTM?n=12&e=7&z=3',
        );
    });
    it('combines proxied and local results for resolving country names', async () => {
        // add a not-real-case document
        await db()
            .collection('cases')
            .insertOne({
                location: {
                    country: 'EE',
                },
            });
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: 'Ainotse',
        });
        const res = await curatorRequest
            .get('/api/geocode/countryNames')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.length == 2);
        expect(res.body[0] === 'Estonia');
        expect(res.body[1] === 'Ainotse');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://location/geocode/countryName?c=EE',
        );
    });
    it('proxies clear calls', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {},
        });
        await curatorRequest.post('/api/geocode/clear').expect(200);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://location/geocode/clear',
            {},
        );
    });
    it('proxies seed calls', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            data: {},
        });
        await curatorRequest
            .post('/api/geocode/seed')
            .send({ loc: 'foo' })
            .expect(200);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://location/geocode/seed',
            {
                loc: 'foo',
            },
        );
    });
});
