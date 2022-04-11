const mockSend = jest.fn().mockResolvedValue({});
const mockInitialize = jest.fn().mockReturnValue({ send: mockSend });

import * as baseUser from './users/base.json';

import { sessions, users } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ISource, sources } from '../src/model/source';
import _ from 'lodash';
import app from '../src/index';
import fullSource from './model/data/source.full.json';
import minimalSource from './model/data/source.minimal.json';
import minimalUpload from './model/data/upload.minimal.json';
import supertest from 'supertest';
import { ObjectId } from 'mongodb';
import { IUpload } from '../src/model/upload';

jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return {
            send: mockSend,
            initialize: mockInitialize,
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
    await sources().deleteMany({});
    await users().deleteMany({});
    await sessions().deleteMany({});

    jest.clearAllMocks();
});

afterAll(async () => {
    await sources().deleteMany({});
    await users().deleteMany({});
    await sessions().deleteMany({});
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
        const id1 = new ObjectId();
        const source1Body : ISource = {
            _id: id1,
            ...fullSource
        } as unknown as ISource;
        source1Body.uploads[0]._id = new ObjectId();

        await sources().insertOne(source1Body);

        const id2 = new ObjectId();
        const source2Body : ISource = {
            _id: id2,
            ...fullSource
        } as unknown as ISource;
        source2Body.uploads[0]._id = new ObjectId();

        await sources().insertOne(source2Body);

        const res = await curatorRequest
            .get('/api/sources/uploads')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.uploads).toHaveLength(2);

        const source = await sources().findOne({_id: id1});
        expect(res.body.uploads[0].upload._id).toEqual(
            source.uploads[0]._id.toHexString(),
        );
        expect(res.body.uploads[0].sourceName).toEqual(source.name);
        expect(res.body.uploads[0].sourceUrl).toEqual(source.origin.url);

        const source2 = await sources().findOne({_id: id2});
        expect(res.body.uploads[1].upload._id).toEqual(
            source2.uploads[0]._id.toHexString(),
        );
        expect(res.body.uploads[1].sourceName).toEqual(source2.name);
        expect(res.body.uploads[1].sourceUrl).toEqual(source2.origin.url);
    });
    it('list should paginate', async () => {
        await sources().insertMany(Array.from(Array(15)).map(() => ({
            _id: new ObjectId(),
            ...fullSource
        })));
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
        const sourceWithErrorId = new ObjectId();
        const uploadErrorID = new ObjectId();
        const sourceWithError = {
            _id: sourceWithErrorId,
            ...fullSource,
            uploads: [
                {
                    _id: uploadErrorID,
                    status: "ERROR",
                    summary: {
                        numCreated: 0,
                        numUpdated: 0,
                        numError: 0,
                        error: "INTERNAL_ERROR",
                    },
                    created: new Date(2020,2,3),
                }
            ],
        };
        await sources().insertOne(sourceWithError);

        const sourceWithNoChangesId = new ObjectId();
        const uploadNoChangesId = new ObjectId();
        const sourceWithNoChanges = {
            _id: sourceWithNoChangesId,
            ...fullSource,
            uploads: [
                {
                    _id: uploadNoChangesId,
                    created: new Date(),
                    status: 'SUCCESS',
                    summary: {},
                },
            ],
        };
        await sources().insertOne(sourceWithNoChanges);

        const sourceWithCreatedUploadsId = new ObjectId();
        const uploadCreatedId = new ObjectId();
        const sourceWithCreatedUploads = {
            _id: sourceWithCreatedUploadsId,
            ...fullSource,
            uploads: [
                {
                    _id: uploadCreatedId,
                    status: 'SUCCESS',
                    summary: { numCreated: 3 },
                    created: new Date(2020, 2, 1),
                },
            ],
        };
        await sources().insertOne(sourceWithCreatedUploads);

        const sourceWithUpdatedUploadsId = new ObjectId();
        const uploadUpdatedId = new ObjectId();
        const sourceWithUpdatedUploads = {
            _id: sourceWithUpdatedUploadsId,
            ...fullSource,
            uploads: [
                {
                    _id: uploadUpdatedId,
                    status: 'SUCCESS',
                    summary: { numUpdated: 3 },
                    created: new Date(2020, 2, 2),
                },
            ],
        };
        await sources().insertOne(sourceWithUpdatedUploads);

        const res = await curatorRequest
            .get('/api/sources/uploads?changes_only=true')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.uploads).toHaveLength(3);
        expect(res.body.uploads[0].upload._id).toEqual(
            uploadErrorID.toHexString(),
        );
        expect(res.body.uploads[1].upload._id).toEqual(
            uploadUpdatedId.toHexString(),
        );
        expect(res.body.uploads[2].upload._id).toEqual(
            uploadCreatedId.toHexString(),
        );
    });
    it('should sort by created date then source name', async () => {
        const sourceId1 = new ObjectId();
        const source1 = {
            _id: sourceId1,
            ...fullSource,
            name: 'source1',
            uploads: [
                {
                    _id: new ObjectId(),
                    status: 'ERROR',
                    summary: {},
                    created: new Date(2020, 2, 1),
                },
                {
                    _id: new ObjectId(),
                    status: 'SUCCESS',
                    summary: { numCreated: 3, numError: 1 },
                    created: new Date(2020, 2, 6),
                },
            ],
        };
        await sources().insertOne(source1);

        const sourceId2 = new ObjectId();
        const source2 = {
            _id: sourceId2,
            ...fullSource,
            name: 'source2',
            uploads: [
                {
                    _id: new ObjectId(),
                    status: 'SUCCESS',
                    summary: { numUpdated: 3 },
                    created: new Date(2020, 2, 5),
                },
                {
                    _id: new ObjectId(),
                    status: 'ERROR',
                    summary: {},
                    created: new Date(2020, 2, 3),
                },
            ],
        };
        await sources().insertOne(source2);

        const sourceId3 = new ObjectId();
        const source3 = {
            _id: sourceId3,
            ...fullSource,
            name: 'source3',
            uploads: [
                {
                    _id: new ObjectId(),
                    status: 'SUCCESS',
                    summary: { numCreated: 3 },
                    created: new Date(2020, 2, 3),
                },
                {
                    _id: new ObjectId(),
                    status: 'SUCCESS',
                    summary: { numCreated: 3 },
                    created: new Date(2020, 2, 4),
                },
            ],
        };
        await sources().insertOne(source3);

        const sourceNoChangesId = new ObjectId();
        const sourceNoChanges = {
            _id: sourceNoChangesId,
            ...fullSource,
            uploads: [
                {
                    _id: new ObjectId(),
                    status: 'SUCCESS',
                    summary: {},
                    created: new Date(2020, 2, 7),
                },
            ],
        };
        await sources().insertOne(sourceNoChanges);

        const res = await curatorRequest
            .get('/api/sources/uploads?page=1&limit=5&changes_only=true')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.uploads).toHaveLength(5);
        expect(res.body.uploads[0].upload._id).toEqual(
            source1.uploads[1]._id.toHexString(),
        );
        expect(res.body.uploads[1].upload._id).toEqual(
            source2.uploads[0]._id.toHexString(),
        );
        expect(res.body.uploads[2].upload._id).toEqual(
            source3.uploads[1]._id.toHexString(),
        );
        expect(res.body.uploads[3].upload._id).toEqual(
            source3.uploads[0]._id.toHexString(),
        );
        expect(res.body.uploads[4].upload._id).toEqual(
            source2.uploads[1]._id.toHexString(),
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
        const source = {
            _id: new ObjectId(),
            ...minimalSource,
        };
        await sources().insertOne(source);
        const upload = {
            _id: new ObjectId(),
            ...minimalUpload
        };

        const res = await curatorRequest
            .post(`/api/sources/${source._id}/uploads`)
            .send(upload)
            .expect('Content-Type', /json/)
            .expect(201);
        const dbSource = await sources().findOne({ _id: source._id });

        expect(res.body._id).toEqual(upload._id.toHexString());
        expect(dbSource?.uploads.map((u: IUpload) => u._id)).toContainEqual(upload._id);
    });

    it('should send a notification email if status is error and recipients defined', async () => {
        const source = {
            _id: new ObjectId(),
            ...fullSource,
        };
        await sources().insertOne(source);
        const upload = {
            _id: new ObjectId(),
            ...minimalUpload
        };
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
        const source = {
            _id: new ObjectId(),
            ...fullSource,
        };
        await sources().insertOne(source);
        const upload = {
            _id: new ObjectId(),
            ...minimalUpload
        }; // Status is SUCCESS.
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
        const source = {
            _id: new ObjectId(),
            ...noSchedule,
        };
        await sources().insertOne(source);
        const upload = {
            _id: new ObjectId(),
            ...minimalUpload
        }; // Status is SUCCESS.
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
        const source = {
            _id: new ObjectId(),
            ...minimalSource,
        };
        await sources().insertOne(source);
        return curatorRequest
            .put(`/api/sources/${source._id}/uploads/${new ObjectId().toHexString()}`)
            .send(minimalUpload)
            .expect(404);
    });
    it('should return 200 with updated upload for valid input', async () => {
        const source = {
            _id: new ObjectId(),
            ...fullSource,
            uploads: [
                {
                    _id: new ObjectId(),
                    ...fullSource.uploads[0],
                }
            ]
        };
        await sources().insertOne(source);
        const newSummary = {
            numCreated: 123456,
            numUpdated: 789,
        };

        const res = await curatorRequest
            .put(`/api/sources/${source._id.toHexString()}/uploads/${source.uploads[0]._id.toHexString()}`)
            .send({
                summary: newSummary,
            })
            .expect('Content-Type', /json/)
            .expect(200);
        const dbSource = await sources().findOne({ _id: source._id });

        expect(res.body.uploads[0].summary).toEqual(newSummary);
        expect(dbSource?.uploads[0].summary).toMatchObject(newSummary);
    });
    it('should send a notification email if updated status is error and recipients defined', async () => {
        const successSource = {
            _id: new ObjectId(),
            ...fullSource,
            uploads: [
                {
                    _id: new ObjectId(),
                    ...fullSource.uploads[0],
                    status: 'SUCCESS',
                },
            ],
        };
        await sources().insertOne(successSource);

        await curatorRequest
            .put(`/api/sources/${successSource._id}/uploads/${successSource.uploads[0]._id}`)
            .send({
                status: 'ERROR',
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(successSource.notificationRecipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if updated status is not error', async () => {
        const source = {
            _id: new ObjectId(),
            ...fullSource,
            uploads: [
                {
                    _id: new ObjectId(),
                    ...fullSource.uploads[0],
                },
            ],
        };
        await sources().insertOne(source);
        
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
        const noSchedule = {
            _id: new ObjectId(),
            ...fullSource,
            uploads: [
                {
                    _id: new ObjectId(),
                    ...fullSource.uploads[0],
                }
            ]
        };
        delete noSchedule.automation.schedule;
        await sources().insertOne(noSchedule);

        await curatorRequest
            .put(`/api/sources/${noSchedule._id}/uploads/${noSchedule.uploads[0]._id}`)
            .send({
                status: 'ERROR',
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(mockSend).not.toHaveBeenCalled();
    });
});
