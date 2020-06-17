import * as baseUser from '../users/base.json';

import app from '../../src/index';
import mongoose from 'mongoose';
import request from 'supertest';
import supertest from 'supertest';

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

describe('Geocodes', () => {
    it('are suggested', async () => {
        const lyon = {
            administrativeAreaLevel1: 'Rhône',
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'Lyon',
        };
        request(app).post('/api/geocode/seed').send(lyon).expect(200);
        const curatorRequest = supertest.agent(app);
        await curatorRequest
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['curator'] } })
            .expect(200);
        curatorRequest
            .get('/api/geocode/suggest')
            .query({ q: 'Lyon' })
            .expect(200, [lyon]);
    });
});
