import request from 'supertest';
import app from '../src/index';

import mongoose from 'mongoose';

beforeAll(async () => {
    await mongoose.connect(
        // This is provided by jest-mongodb.
        // The `else testurl` is to appease Typescript.
        process.env.MONGO_URL || 'testurl',
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        },
    );
});

afterAll(async () => {
    await mongoose.disconnect();
});

describe('GET', () => {
    it('list should return 200', (done) => {
        request(app).get('/api/sources').expect(200, done);
    });
    it('one item should return 501 Not Implemented', (done) => {
        request(app).get('/api/sources/42').expect(501, done);
    });
});

describe('PUT', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).put('/api/sources/id').expect(501, done);
    });
});

describe('POST', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).post('/api/sources/').expect(501, done);
    });
});

describe('DELETE', () => {
    it('should return 501 Not Implemented', (done) => {
        request(app).delete('/api/sources/42').expect(501, done);
    });
});
