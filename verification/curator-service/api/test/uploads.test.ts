const mockSend = jest.fn().mockResolvedValue({});

import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { Source } from '../src/model/source';
import { Upload } from '../src/model/upload';
import { UploadSummary } from '../src/model/upload-summary';
import _ from 'lodash';
import app from '../src/index';
import fullSource from './model/data/source.full.json';
import minimalSource from './model/data/source.minimal.json';
import minimalUpload from './model/data/upload.minimal.json';
import supertest from 'supertest';

jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return {
            send: mockSend,
            initialize: jest.fn().mockResolvedValue({ send: mockSend }),
        };
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

    jest.clearAllMocks();
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
        const sourceWithError = new Source(fullSource);
        sourceWithError.uploads[0].created = new Date(2020, 2, 3);
        await sourceWithError.save();

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
                created: new Date(2020, 2, 1),
            }),
        ];
        await sourceWithCreatedUploads.save();

        const sourceWithUpdatedUploads = new Source(fullSource);
        sourceWithUpdatedUploads.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numUpdated: 3 }),
                created: new Date(2020, 2, 2),
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
            sourceWithUpdatedUploads.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[2].upload._id).toEqual(
            sourceWithCreatedUploads.uploads[0]._id.toString(),
        );
    });
    it('should sort by created date then source name', async () => {
        const source1 = new Source(fullSource);
        source1.name = 'source1';
        source1.uploads = [
            new Upload({
                status: 'ERROR',
                summary: new UploadSummary(),
                created: new Date(2020, 2, 1),
            }),
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numCreated: 3 }),
                created: new Date(2020, 2, 6),
            }),
        ];
        await source1.save();

        const source2 = new Source(fullSource);
        source2.name = 'source2';
        source2.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numUpdated: 3 }),
                created: new Date(2020, 2, 5),
            }),
            new Upload({
                status: 'ERROR',
                summary: new UploadSummary(),
                created: new Date(2020, 2, 3),
            }),
        ];
        await source2.save();

        const source3 = new Source(fullSource);
        source3.name = 'source3';
        source3.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numCreated: 3 }),
                created: new Date(2020, 2, 3),
            }),
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary({ numCreated: 3 }),
                created: new Date(2020, 2, 4),
            }),
        ];
        await source3.save();

        const sourceNoChanges = new Source(fullSource);
        sourceNoChanges.uploads = [
            new Upload({
                status: 'SUCCESS',
                summary: new UploadSummary(),
                created: new Date(2020, 2, 7),
            }),
        ];
        await sourceNoChanges.save();

        const res = await curatorRequest
            .get('/api/sources/uploads?page=1&limit=5&changes_only=true')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.uploads).toHaveLength(5);
        expect(res.body.uploads[0].upload._id).toEqual(
            source1.uploads[1]._id.toString(),
        );
        expect(res.body.uploads[1].upload._id).toEqual(
            source2.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[2].upload._id).toEqual(
            source3.uploads[1]._id.toString(),
        );
        expect(res.body.uploads[3].upload._id).toEqual(
            source3.uploads[0]._id.toString(),
        );
        expect(res.body.uploads[4].upload._id).toEqual(
            source2.uploads[1]._id.toString(),
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

    it('should send a notification email if status is error and recipients defined', async () => {
        const source = await new Source(fullSource).save();
        const upload = new Upload(minimalUpload);
        upload.status = 'ERROR';
        await curatorRequest
            .post(`/api/sources/${source._id}/uploads`)
            .send(upload)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(source.notificationRecipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if status not error', async () => {
        const source = await new Source(fullSource).save();
        const upload = new Upload(minimalUpload); // Status is SUCCESS.
        await curatorRequest
            .post(`/api/sources/${source._id}/uploads`)
            .send(upload)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(mockSend).not.toHaveBeenCalled();
    });
    it('should not send a notification email if no schedule configured', async () => {
        const noSchedule = _.cloneDeep(fullSource);
        delete noSchedule.automation.schedule;
        const source = await new Source(noSchedule).save();
        const upload = new Upload(minimalUpload); // Status is SUCCESS.
        upload.status = 'ERROR';
        await curatorRequest
            .post(`/api/sources/${source._id}/uploads`)
            .send(upload)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(mockSend).not.toHaveBeenCalled();
    });
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
            .put(`/api/sources/${source._id}/uploads/123456789012345678901234`)
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
            .put(`/api/sources/${source._id}/uploads/${source.uploads[0]._id}`)
            .send({
                summary: newSummary,
            })
            .expect('Content-Type', /json/)
            .expect(200);
        const dbSource = await Source.findById(source._id);

        expect(res.body.uploads[0].summary).toEqual(newSummary);
        expect(dbSource?.uploads[0].summary).toMatchObject(newSummary);
    });
    it('should send a notification email if updated status is error and recipients defined', async () => {
        const successSource = _.cloneDeep(fullSource);
        successSource.uploads[0].status = 'SUCCESS';
        const source = await new Source(successSource).save();

        await curatorRequest
            .put(`/api/sources/${source._id}/uploads/${source.uploads[0]._id}`)
            .send({
                status: 'ERROR',
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(source.notificationRecipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if updated status is not error', async () => {
        const source = await new Source(fullSource).save();

        await curatorRequest
            .put(`/api/sources/${source._id}/uploads/${source.uploads[0]._id}`)
            .send({
                status: 'IN_PROGRESS',
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(mockSend).not.toHaveBeenCalled();
    });
    it('should not send a notification email if schedule not configured', async () => {
        const noSchedule = _.cloneDeep(fullSource);
        delete noSchedule.automation.schedule;
        const source = await new Source(noSchedule).save();

        await curatorRequest
            .put(`/api/sources/${source._id}/uploads/${source.uploads[0]._id}`)
            .send({
                status: 'ERROR',
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(mockSend).not.toHaveBeenCalled();
    });
});
