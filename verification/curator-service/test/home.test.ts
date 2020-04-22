import request from 'supertest';
import app from '../src/index';

import mongoose from 'mongoose';

beforeAll(() => {
    return mongoose.connect(
        // This is provided by jest-mongodb.
        // The `else testurl` is to appease Typescript.
        process.env.MONGO_URL || 'testurl',
        { useNewUrlParser: true, useUnifiedTopology: true },
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
