import * as baseUser from './users/base.json';

import app from '../src/index';
import axios from 'axios';
import mongoose from 'mongoose';
import supertest from 'supertest';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

beforeAll(() => {
    return mongoose.connect(
        // This is provided by jest-mongodb.
        // The `else testurl` is to appease Typescript.
        process.env.MONGO_URL || 'testurl',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        },
    );
});

afterAll(() => {
    return mongoose.disconnect();
});

const emptyAxiosResponse = {
    data: {},
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
};

describe('Cases', () => {
    it('denies access to non readers/curators', async () => {
        await supertest
            .agent(app)
            .get('/api/cases?limit=10&page=1&filter=')
            .expect(403, /reader/)
            .expect('Content-Type', /json/);
    });
    it('proxies list calls', async () => {
        mockedAxios.get.mockResolvedValueOnce(emptyAxiosResponse);
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['reader'] } })
            .expect(200);
        await request
            .get('/api/cases?limit=10&page=1&filter=')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases?limit=10&page=1&filter=',
        );
    });

    it('proxies get calls', async () => {
        mockedAxios.get.mockResolvedValueOnce(emptyAxiosResponse);
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['reader'] } })
            .expect(200);
        await request
            .get('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
        );
    });

    it('proxies update calls', async () => {
        mockedAxios.put.mockResolvedValueOnce(emptyAxiosResponse);
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator'] } })
            .expect(200);
        await request
            .put('/api/cases/5e99f21a1c9d440000ceb088')
            .send({ age: '42' })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(
            mockedAxios.put,
        ).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
            { age: '42' },
        );
    });

    it('proxies delete calls', async () => {
        mockedAxios.delete.mockResolvedValueOnce(emptyAxiosResponse);
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator'] } })
            .expect(200);
        await request
            .delete('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
        );
    });

    it('proxies create calls', async () => {
        mockedAxios.post.mockResolvedValueOnce(emptyAxiosResponse);
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator'] } })
            .expect(200);
        await request
            .post('/api/cases')
            .send({ age: '42' })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                age: '42',
            },
        );
    });
});
