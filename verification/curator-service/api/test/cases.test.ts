import * as baseUser from './users/base.json';

import { GeocodeResult, Resolution } from '../src/geocoding/geocoder';
import { Session, User } from '../src/model/user';

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

beforeEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

afterAll(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

const emptyAxiosResponse = {
    data: {},
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
};

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
        await supertest
            .agent(app)
            .get('/api/cases?limit=10&page=1&filter=')
            .expect(403, /reader/)
            .expect('Content-Type', /json/);
    });
    it('proxies list calls', async () => {
        mockedAxios.get.mockResolvedValueOnce(emptyAxiosResponse);
        await curatorRequest
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
        await curatorRequest
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
            { age: '42' },
        );
    });

    it('proxies delete calls', async () => {
        mockedAxios.delete.mockResolvedValueOnce(emptyAxiosResponse);
        await curatorRequest
            .delete('/api/cases/5e99f21a1c9d440000ceb088')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases/5e99f21a1c9d440000ceb088',
        );
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
        mockedAxios.put.mockResolvedValueOnce(emptyAxiosResponse);
        await curatorRequest
            .put('/api/cases')
            .send({ age: '42', location: { query: 'Lyon' } })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                age: '42',
                location: lyon,
            },
        );
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
        mockedAxios.post.mockResolvedValueOnce(emptyAxiosResponse);
        await curatorRequest
            .post('/api/cases')
            .send({
                age: '42',
                location: { query: 'Lyon', limitToResolution: 'Admin3' },
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/cases',
            {
                age: '42',
                location: lyon,
            },
        );
    });

    it('returns 404 when no geocode could be found on create', async () => {
        mockedAxios.post.mockResolvedValueOnce(emptyAxiosResponse);
        await curatorRequest
            .post('/api/cases')
            .send({ age: '42', location: { query: 'Lyon' } })
            .expect(404);
    });
});
