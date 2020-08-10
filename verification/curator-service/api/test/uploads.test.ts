import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { Source } from '../src/model/source';
import { Upload } from '../src/model/upload';
import app from '../src/index';
import minimalSource from './model/data/source.minimal.json';
import minimalUpload from './model/data/upload.minimal.json';
import supertest from 'supertest';

let mongoServer: MongoMemoryServer;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

beforeEach(async () => {
    await Source.deleteMany({});
    await Upload.deleteMany({});
    await User.deleteMany({});
    await Session.deleteMany({});
});

afterAll(async () => {
    await Source.deleteMany({});
    await Upload.deleteMany({});
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

describe('unauthenticated access', () => {
    it('should be denied', (done) => {
        supertest
            .agent(app)
            .post('/api/sources/012345678901234567890123/uploads')
            .send(minimalUpload)
            .expect(403, done);
    });
});

describe('POST', () => {
    it('should return 415 if input missing body', () => {
        return curatorRequest
            .post('/api/sources/012345678901234567890123/uploads')
            .send()
            .expect(415);
    });
    it('should return 400 if parent source ID malformed', () => {
        return curatorRequest
            .post('/api/sources/foo123/uploads')
            .send({})
            .expect(400);
    });
    it('should return 404 if parent source ID not found', () => {
        return curatorRequest
            .post('/api/sources/012345678901234567890123/uploads')
            .send(minimalUpload)
            .expect(404);
    });
    it('should return 201 with created upload for valid input', async () => {
        const source = await new Source(minimalSource).save();
        const upload = new Upload(minimalUpload);

        const res = await curatorRequest
            .post(`/api/sources/${source._id}/uploads`)
            .send(upload)
            .expect('Content-Type', /json/)
            .expect(201);
        const dbSource = await Source.findById(source._id);

        expect(res.body._id).toEqual(upload._id.toString());
        expect(dbSource?.uploads.map((u) => u._id)).toContainEqual(upload._id);
    });
});
