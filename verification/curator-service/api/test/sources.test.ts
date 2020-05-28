import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { Source } from '../src/model/source';
import app from '../src/index';
import mongoose from 'mongoose';
import supertest from 'supertest';

jest.mock('../src/clients/aws-events-client', () => {
    const mockPutRule = jest
        .fn()
        .mockResolvedValue('arn:aws:events:fake:event:rule/name');
    return jest.fn().mockImplementation(() => {
        return { putRule: mockPutRule };
    });
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

beforeEach(() => {
    return Source.deleteMany({});
});

afterEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

let curatorRequest: any;
beforeEach(async () => {
    curatorRequest = supertest.agent(app);
    await curatorRequest
        .post('/auth/register')
        .send({ ...baseUser, ...{ roles: ['curator'] } })
        .expect(200);
});

describe('GET', () => {
    it('list should return 200', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        }).save();
        const res = await curatorRequest
            .get('/api/sources')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.sources).toHaveLength(1);
        expect(res.body.sources[0]._id).toEqual(source.id);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
    });
    it('list should paginate', async () => {
        for (const i of Array.from(Array(15).keys())) {
            await new Source({
                name: `test-source-${i}`,
                origin: { url: 'http://foo.bar' },
            }).save();
        }
        // Fetch first page.
        let res = await curatorRequest
            .get('/api/sources?page=1&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.sources).toHaveLength(10);
        // Second page is expected.
        expect(res.body.nextPage).toEqual(2);

        // Fetch second page.
        res = await curatorRequest
            .get(`/api/sources?page=${res.body.nextPage}&limit=10`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.sources).toHaveLength(5);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);

        // Fetch inexistant page.
        res = await curatorRequest
            .get('/api/sources?page=42&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.sources).toHaveLength(0);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);
    });
    it('rejects negative page param', (done) => {
        curatorRequest.get('/api/sources?page=-7').expect(422, done);
    });
    it('rejects negative limit param', (done) => {
        curatorRequest.get('/api/sources?page=1&limit=-2').expect(422, done);
    });
    it('one existing item should return 200', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        }).save();
        const res = await curatorRequest
            .get(`/api/sources/${source.id}`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body._id).toEqual(source.id);
    });
});

describe('PUT', () => {
    it('should update a source', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        }).save();
        const res = await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({ name: 'new name' })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.name).toEqual('new name');
        // Check stuff that didn't change.
        expect(res.body.origin.url).toEqual('http://foo.bar');
    });
    it('cannot update an inexistent source', (done) => {
        curatorRequest
            .put('/api/sources/424242424242424242424242')
            .expect(404, done);
    });
    it('should not update to an invalid source', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        }).save();
        const res = await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({ name: '' })
            .expect(422);
        expect(res.body).toMatch('Enter a name');
    });
});

describe('POST', () => {
    it('should return the created source', async () => {
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever' },
        };
        const res = await curatorRequest
            .post('/api/sources')
            .send(source)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(res.body.name).toEqual(source.name);
    });
    it('should not create invalid source', async () => {
        const res = await curatorRequest.post('/api/sources').expect(422);
        expect(res.body).toMatch('Enter a name');
    });
});

describe('DELETE', () => {
    it('should delete a source', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
        }).save();
        const res = await curatorRequest
            .delete(`/api/sources/${source.id}`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body._id).toEqual(source.id);
    });
    it('should not be able to delete a non existent source', (done) => {
        curatorRequest
            .delete('/api/sources/424242424242424242424242')
            .expect(404, done);
    });
});
