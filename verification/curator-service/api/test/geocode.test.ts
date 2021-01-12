import * as baseUser from './users/base.json';

import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import axios from 'axios';
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

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
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
            'http://localhost:3000/api/geocode/suggest?q=Lyon',
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
            'http://localhost:3000/api/geocode/clear',
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
            'http://localhost:3000/api/geocode/seed',
            {
                loc: 'foo',
            },
        );
    });
});
