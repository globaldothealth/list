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

describe('GET /', () => {
    it('should return 200 OK', (done) => {
        request(app).get('/').expect(200, done);
    });
});
