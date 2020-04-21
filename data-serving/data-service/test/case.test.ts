import request from 'supertest';
import app from '../src/index';
import mongoose from 'mongoose';

beforeAll(async () => {
    await mongoose.connect(
        // This is provided by jest-mongodb.
        // The `else testurl` is to appease Typescript.
        process.env.MONGO_URL || 'testurl',
        { useNewUrlParser: true, useCreateIndex: true },
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
    it('one item should return 200 OK', (done) => {
        request(app).get('/api/cases/id').expect(200, done);
    });
    it('list should return 200 OK', (done) => {
        request(app).get('/api/cases').expect(200, done);
    });
});

describe('POST', () => {
    it('create without valid date should return 422', (done) => {
        request(app)
            .post('/api/cases')
            .send({ date: 'not-a-date', outcome: 'recovered' })
            .expect(422, done);
    });
    it('create without valid outcome should return 422', (done) => {
        request(app)
            .post('/api/cases')
            .send({ date: '2020-04-01', outcome: 'not-a-valid-outcome' })
            .expect(422, done);
    });
    it('create with valid input should return 200 OK with json', (done) => {
        request(app)
            .post('/api/cases')
            .send({ date: '2020-04-01', outcome: 'recovered' })
            .expect('Content-Type', /json/)
            .expect(200, done);
    });
});

describe('PUT', () => {
    it('update should return 200 OK', (done) => {
        request(app).put('/api/cases/id').expect(200, done);
    });
});

describe('DELETE', () => {
    it('should return 200 OK', (done) => {
        request(app).delete('/api/cases/id').expect(200, done);
    });
});
