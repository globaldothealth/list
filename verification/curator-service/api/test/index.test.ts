import app from '../src/index';
import mongoose from 'mongoose';
import request from 'supertest';

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

describe('GET /random-url', () => {
    it('should return 404', (done) => {
        request(app).get('/random-url').expect(404, done);
    });
});

describe('GET /health', () => {
    it('should be healthy when connected', (done) => {
        request(app).get('/health').expect(200, done);
    });
});

describe('location', () => {
    it('should be suggested', (done) => {
        request(app)
            .get('/api/suggest/locations')
            .query({ q: 'some prefix' })
            .expect(200, done);
    });
});
