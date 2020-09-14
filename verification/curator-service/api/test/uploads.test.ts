import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { Source } from '../src/model/source';
import { Upload } from '../src/model/upload';
import { UploadSummary } from '../src/model/upload-summary';
import app from '../src/index';
import fullSource from './model/data/source.full.json';
import minimalSource from './model/data/source.minimal.json';
import minimalUpload from './model/data/upload.minimal.json';
import supertest from 'supertest';

const mockInitialize = jest.fn().mockResolvedValue({});
jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: mockInitialize };
    });
});

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

describe('GET', () => {
    it('should list all uploads', async () => {
        const source = await new Source(fullSource).save();
        const source2 = await new Source(fullSource).save();

        const res = await curatorRequest
            .get('/api/sources/uploads')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.uploads).toHaveLength(2);
        expect(res.body.uploads[0].upload._id).toEqual(
            source.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[0].sourceName).toEqual(source.name);
        expect(res.body.uploads[0].sourceUrl).toEqual(source.origin.url);
        expect(res.body.uploads[1].upload._id).toEqual(
            source2.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[1].sourceName).toEqual(source2.name);
        expect(res.body.uploads[1].sourceUrl).toEqual(source2.origin.url);
    });
    it('list should paginate', async () => {
        Array.from(Array(15)).forEach(
            async () => await new Source(fullSource).save(),
        );
        // Fetch first page.
        let res = await curatorRequest
            .get('/api/sources/uploads?page=1&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.uploads).toHaveLength(10);
        // Second page is expected.
        expect(res.body.nextPage).toEqual(2);

        // Fetch second page.
        res = await curatorRequest
            .get(`/api/sources/uploads?page=${res.body.nextPage}&limit=10`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.uploads).toHaveLength(5);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);

        // Fetch nonexistent page.
        res = await curatorRequest
            .get('/api/sources/uploads?page=42&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.uploads).toHaveLength(0);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);
    });
    it('should filter for changes only', async () => {
        const sourceWithError = await new Source(fullSource).save();

        const sourceWithNoChanges = new Source(fullSource);
        sourceWithNoChanges.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({}),
            }),
        ];
        await sourceWithNoChanges.save();

        const sourceWithCreatedUploads = new Source(fullSource);
        sourceWithCreatedUploads.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numCreated: 3 }),
            }),
        ];
        await sourceWithCreatedUploads.save();

        const sourceWithUpdatedUploads = new Source(fullSource);
        sourceWithUpdatedUploads.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numUpdated: 3 }),
            }),
        ];
        await sourceWithUpdatedUploads.save();

        const res = await curatorRequest
            .get('/api/sources/uploads?changes_only=true')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.uploads).toHaveLength(3);
        expect(res.body.uploads[0].upload._id).toEqual(
            sourceWithError.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[1].upload._id).toEqual(
            sourceWithCreatedUploads.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[2].upload._id).toEqual(
            sourceWithUpdatedUploads.uploads[0]._id.toString(),
        );
    });
    it('rejects negative page param', (done) => {
        curatorRequest.get('/api/sources/uploads?page=-7').expect(400, done);
    });
    it('rejects negative limit param', (done) => {
        curatorRequest
            .get('/api/sources/uploads?page=1&limit=-2')
            .expect(400, done);
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

    describe('PUT', () => {
        it('should return 415 if input missing body', () => {
            return curatorRequest
                .put(
                    '/api/sources/012345678901234567890123/uploads/123456789012345678901234',
                )
                .send()
                .expect(415);
        });
        it('should return 400 if parent source ID malformed', () => {
            return curatorRequest
                .put('/api/sources/abc123/uploads/012345678901234567890123')
                .send(minimalUpload)
                .expect(400);
        });
        it('should return 404 if parent source ID not found', () => {
            return curatorRequest
                .put(
                    '/api/sources/012345678901234567890123/uploads/123456789012345678901234',
                )
                .send(minimalUpload)
                .expect(404);
        });
        it('should return 400 if upload ID malformed', () => {
            return curatorRequest
                .put('/api/sources/012345678901234567890123/uploads/abc123')
                .send(minimalUpload)
                .expect(400);
        });
        it('should return 404 if upload ID not found', async () => {
            const source = await new Source(minimalSource).save();
            return curatorRequest
                .put(
                    `/api/sources/${source._id}/uploads/123456789012345678901234`,
                )
                .send(minimalUpload)
                .expect(404);
        });
        it('should return 200 with updated upload for valid input', async () => {
            const source = await new Source(fullSource).save();
            const newSummary = {
                numCreated: 123456,
                numUpdated: 789,
            };

            const res = await curatorRequest
                .put(
                    `/api/sources/${source._id}/uploads/${source.uploads[0]._id}`,
                )
                .send({
                    summary: newSummary,
                })
                .expect('Content-Type', /json/)
                .expect(200);
            const dbSource = await Source.findById(source._id);

            expect(res.body.uploads[0].summary).toEqual(newSummary);
            expect(dbSource?.uploads[0].summary).toMatchObject(newSummary);
        });
    });
});
