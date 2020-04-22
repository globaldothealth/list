import request from 'supertest';
import app from '../src/index';

import mongoose from 'mongoose';
import { Source } from '../src/model/source';

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

beforeEach(() => {
    return Source.deleteMany({});
});

describe('GET', () => {
    it('list should return 200', async () => {
        const source = new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        });
        const saved = await source.save();
        const res = await request(app)
            .get('/api/sources')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]._id).toEqual(saved.id);
    });
    it('one existing item should return 200', async () => {
        const source = new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        });
        const saved = await source.save();
        console.log(saved);
        const res = await request(app)
            .get(`/api/sources/${saved.id}`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body._id).toEqual(saved.id);
    });
});

describe('PUT', () => {
    it('should update a source', async () => {
        const source = new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        });
        const saved = await source.save();
        saved.name = 'new name';
        const res = await request(app)
            .put(`/api/sources/${saved.id}`)
            .send({ name: 'new name' })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.name).toEqual('new name');
        // Check stuff that didn't change.
        expect(res.body.origin.url).toEqual('http://foo.bar');
    });
    it('cannot update an inexistent source', (done) => {
        request(app)
            .put('/api/sources/424242424242424242424242')
            .expect(404, done);
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
