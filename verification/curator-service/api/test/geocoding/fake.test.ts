import app from '../../src/index';
import mongoose from 'mongoose';
import request from 'supertest';

jest.mock('../../src/geocoding/mapbox');

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

describe('FakeGeocoder', () => {
    it('can seed geocodes', (done) => {
        request(app)
            .post('/api/geocode/seed')
            .send({
                administrativeAreaLevel1: 'Rhône',
                country: 'France',
                geometry: { latitude: 45.75889, longitude: 4.84139 },
                text: 'Lyon',
            })
            .expect(200, done);
        // TODO: Check for seeded geocode once we can query them.
    });
    it('can clear geocodes', (done) => {
        request(app).post('/api/geocode/clear').expect(200, done);
    });
});
