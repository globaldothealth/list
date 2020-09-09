// These must be at the top of the file; jest hoists jest.mock() calls to the
// top of the file, and these must be defined prior to such calls.
const mockDeleteRule = jest.fn().mockResolvedValue({});
const mockPutRule = jest
    .fn()
    .mockResolvedValue('arn:aws:events:fake:event:rule/name');
const mockInvoke = jest.fn().mockResolvedValue({ Payload: '' });

import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { Source } from '../src/model/source';
import app from '../src/index';
import supertest from 'supertest';

jest.mock('../src/clients/aws-events-client', () => {
    return jest.fn().mockImplementation(() => {
        return { deleteRule: mockDeleteRule, putRule: mockPutRule };
    });
});
jest.mock('../src/clients/aws-lambda-client', () => {
    return jest.fn().mockImplementation(() => {
        return { invokeRetrieval: mockInvoke };
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
    jest.clearAllMocks();
    await Source.deleteMany({});
    await User.deleteMany({});
    await Session.deleteMany({});
});

afterAll(async () => {
    await Source.deleteMany({});
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
        supertest.agent(app).get('/api/sources').expect(403, done);
    });
});

describe('GET', () => {
    it('list should return 200', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
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
    it('list should filter by url if supplied', async () => {
        const relevantSource = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
        }).save();
        await new Source({
            name: 'test-source',
            origin: { url: 'http://bar.baz' },
            format: 'JSON',
        }).save();

        const res = await curatorRequest
            .get('/api/sources?url=foo')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(await relevantSource.collection.countDocuments()).toEqual(2);
        expect(res.body.sources).toHaveLength(1);
        expect(res.body.sources[0]._id).toEqual(relevantSource.id);
    });
    it('list should paginate', async () => {
        for (const i of Array.from(Array(15).keys())) {
            await new Source({
                name: `test-source-${i}`,
                origin: { url: 'http://foo.bar' },
                format: 'JSON',
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

        // Fetch nonexistent page.
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
        curatorRequest.get('/api/sources?page=-7').expect(400, done);
    });
    it('rejects negative limit param', (done) => {
        curatorRequest.get('/api/sources?page=1&limit=-2').expect(400, done);
    });
    it('one existing item should return 200', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
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
            format: 'JSON',
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
        expect(mockPutRule).not.toHaveBeenCalled();
    });
    it('should create an AWS rule with target if provided schedule expression', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
        }).save();
        const scheduleExpression = 'rate(1 hour)';
        const res = await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({
                automation: {
                    schedule: { awsScheduleExpression: scheduleExpression },
                },
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.automation.schedule.awsRuleArn).toBeDefined();
        expect(mockPutRule).toHaveBeenCalledWith(
            source.toAwsRuleName(),
            source.toAwsRuleDescription(),
            scheduleExpression,
            expect.any(String),
            source.toAwsRuleTargetId(),
            source._id.toString(),
            source.toAwsStatementId(),
        );
    });
    it('should update AWS rule description on source rename', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
            automation: {
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(1 hour)',
                },
            },
        }).save();
        const newName = 'name2';
        await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({
                name: newName,
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockPutRule).toHaveBeenCalledWith(
            source._id.toString(),
            source.set('name', newName).toAwsRuleDescription(),
        );
    });
    it('cannot update an nonexistent source', (done) => {
        curatorRequest
            .put('/api/sources/5ea86423bae6982635d2e1f8')
            .send({
                name: 'test-source',
                origin: { url: 'http://foo.bar' },
            })
            .expect(404, done);
    });
    it('should not update to an invalid source', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
        }).save();
        return curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({ name: '' })
            .expect(422, /Enter a name/);
    });
    it('should be able to set a parser without schedule', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
        }).save();
        await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({
                automation: {
                    parser: {
                        awsLambdaArn:
                            'arn:aws:lambda:us-east-1:612888738066:function:some-func',
                    },
                },
            })
            .expect(200, /arn/);
    });
});

describe('POST', () => {
    it('should return the created source', async () => {
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever' },
            format: 'JSON',
        };
        const res = await curatorRequest
            .post('/api/sources')
            .send(source)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(res.body.name).toEqual(source.name);
        expect(mockPutRule).not.toHaveBeenCalled();
    });
    it('should create an AWS rule with target if provided schedule expression', async () => {
        const scheduleExpression = 'rate(1 hour)';
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever' },
            format: 'JSON',
            automation: {
                schedule: { awsScheduleExpression: scheduleExpression },
            },
        };
        const res = await curatorRequest
            .post('/api/sources')
            .send(source)
            .expect('Content-Type', /json/)
            .expect(201);
        const createdSource = new Source(res.body);
        expect(createdSource.automation.schedule.awsRuleArn).toBeDefined();
        expect(mockPutRule).toHaveBeenCalledWith(
            createdSource.toAwsRuleName(),
            createdSource.toAwsRuleDescription(),
            scheduleExpression,
            expect.any(String),
            createdSource.toAwsRuleTargetId(),
            createdSource._id.toString(),
            createdSource.toAwsStatementId(),
        );
    });
    it('should not create an incomplete source', async () => {
        await curatorRequest.post('/api/sources').send({}).expect(400);
    });
    it('should not create invalid source', async () => {
        await curatorRequest
            .post('/api/sources')
            .send({ origin: { url: 2 } })
            .expect(422);
    });
});

describe('DELETE', () => {
    it('should delete a source', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
        }).save();
        await curatorRequest.delete(`/api/sources/${source.id}`).expect(204);
        expect(mockDeleteRule).not.toHaveBeenCalled();
    });
    it('should delete corresponding AWS rule (et al.) if source contains ruleArn', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar' },
            format: 'JSON',
            automation: {
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(1 hour)',
                },
            },
        }).save();
        await curatorRequest.delete(`/api/sources/${source.id}`).expect(204);
        expect(mockDeleteRule).toHaveBeenCalledWith(
            source.toAwsRuleName(),
            source.toAwsRuleTargetId(),
            expect.any(String),
            source.toAwsStatementId(),
        );
    });
    it('should not be able to delete a non existent source', (done) => {
        curatorRequest
            .delete('/api/sources/424242424242424242424242')
            .expect(404, done);
    });

    describe('retrieval', () => {
        it('can be invoked', (done) => {
            curatorRequest
                .post('/api/sources/424242424242424242424242/retrieve')
                .expect(200, done);
        });
    });
});
