// These must be at the top of the file; jest hoists jest.mock() calls to the
// top of the file, and these must be defined prior to such calls.
const mockDeleteRule = jest.fn().mockResolvedValue({});
const mockPutRule = jest
    .fn()
    .mockResolvedValue('arn:aws:events:fake:event:rule/name');
const mockDoRetrieval = jest.fn().mockResolvedValue({ Payload: '' });
const mockSend = jest.fn();
const mockInitialize = jest.fn().mockReturnValue({ send: mockSend });

import * as baseUser from './users/base.json';

import { sessions, users } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { cases, restrictedCases } from '../src/model/case';
import { awsRuleDescriptionForSource, awsRuleNameForSource, awsRuleTargetIdForSource, awsStatementIdForSource, ISource, sources } from '../src/model/source';
import app from '../src/index';
import axios from 'axios';
import supertest from 'supertest';
import { ObjectId } from 'mongodb';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/clients/aws-events-client', () => {
    return jest.fn().mockImplementation(() => {
        return { deleteRule: mockDeleteRule, putRule: mockPutRule };
    });
});
jest.mock('../src/clients/aws-batch-client', () => {
    return jest.fn().mockImplementation(() => {
        return { doRetrieval: mockDoRetrieval };
    });
});
jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return {
            initialize: mockInitialize,
            send: mockSend,
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
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
    await sources().deleteMany({});
    await users().deleteMany({});
    await sessions().deleteMany({});
});

afterEach(async () => {
    mockSend.mockReset();
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
        supertest.agent(app).get('/api/sources').expect(403, done);
    });
});

describe('GET', () => {
    it('list should return 200', async () => {
        const id1 = new ObjectId();
        await sources().insertOne({
            _id: id1,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const id2 = new ObjectId();
        await sources().insertOne({
            _id: id2,
            name: 'another-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const res = await curatorRequest
            .get('/api/sources')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.sources).toHaveLength(2);
        // Ordered by name.
        expect(res.body.sources[0]._id).toEqual(id2.toHexString());
        expect(res.body.sources[1]._id).toEqual(id1.toHexString());
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
    });
    it('list should filter by url if supplied', async () => {
        const relevantId = new ObjectId();
        await sources().insertOne({
            _id: relevantId,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        await sources().insertOne({
            name: 'test-source',
            origin: { url: 'http://bar.baz', license: 'MIT' },
            format: 'JSON',
        });

        const res = await curatorRequest
            .get('/api/sources?url=foo')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(await sources().countDocuments()).toEqual(2);
        expect(res.body.sources).toHaveLength(1);
        expect(res.body.sources[0]._id).toEqual(relevantId.toHexString());
    });
    it('list should paginate', async () => {
        for (const i of Array.from(Array(15).keys())) {
            await sources().insertOne({
                name: `test-source-${i}`,
                origin: { url: 'http://foo.bar', license: 'MIT' },
                format: 'JSON',
            });
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
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const res = await curatorRequest
            .get(`/api/sources/${id.toHexString()}`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body._id).toEqual(id.toHexString());
    });
});

describe('PUT', () => {
    it('should update a source', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const res = await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({ name: 'new name' })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.name).toEqual('new name');
        // Check stuff that didn't change.
        expect(res.body.origin.url).toEqual('http://foo.bar');
        expect(mockPutRule).not.toHaveBeenCalled();
    });
    it('should update a source line list exclusion', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const res = await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({ excludeFromLineList: true })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.excludeFromLineList).toBeTruthy();
        // Check stuff that didn't change.
        expect(res.body.origin.url).toEqual('http://foo.bar');
        expect(mockPutRule).not.toHaveBeenCalled();
    });
    it('should update date filtering of a source', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        let res = await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                dateFilter: {
                    numDaysBeforeToday: 3,
                    op: 'EQ',
                },
            })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.dateFilter).toEqual({
            numDaysBeforeToday: 3,
            op: 'EQ',
        });
        // Now clear the date filter.
        res = await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                dateFilter: {},
            })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.dateFilter).toBeUndefined();

        expect(mockPutRule).not.toHaveBeenCalledTimes(2);
    });
    it('should create an AWS rule with target if provided schedule expression', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const source = await sources().findOne({ _id: id });
        const scheduleExpression = 'rate(1 hour)';
        const res = await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                automation: {
                    schedule: { awsScheduleExpression: scheduleExpression },
                },
            })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.automation.schedule.awsRuleArn).toBeDefined();
        expect(mockPutRule).toHaveBeenCalledWith(
            awsRuleNameForSource(source),
            awsRuleDescriptionForSource(source),
            scheduleExpression,
            undefined,
            awsRuleTargetIdForSource(source),
            source._id.toString(),
            awsStatementIdForSource(source),
        );
    });
    it('should send a notification email if automation added and recipients defined', async () => {
        const id = new ObjectId();
        const recipients = ['foo@bar.com'];
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: recipients,
        });
        await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                automation: {
                    schedule: { awsScheduleExpression: 'rate(1 hour)' },
                },
            })
            .expect(200)
            .expect('Content-Type', /json/);

        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(recipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should send a notification email if automation removed', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: { awsScheduleExpression: 'rate(1 hour)' },
            },
            notificationRecipients: ['foo@bar.com'],
        });
        const recipients = ['foo@bar.com'];
        await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({ automation: { schedule: undefined } })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(recipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if automation unchanged', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: { awsScheduleExpression: 'rate(1 hour)' },
            },
            notificationRecipients: ['foo@bar.com'],
        });
        await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({ format: 'CSV' })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockSend).not.toHaveBeenCalled();
    });
    it('should update AWS rule description on source rename', async () => {
        const id = new ObjectId();
        const source = {
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(1 hour)',
                },
            },
        };
        await sources().insertOne(source);
        const newName = 'name2';
        await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                name: newName,
            })
            .expect(200)
            .expect('Content-Type', /json/);
        source['name'] = newName;
        expect(mockPutRule).toHaveBeenCalledWith(
            id.toHexString(),
            awsRuleDescriptionForSource(source as ISource),
        );
    });
    it('cannot update an nonexistent source', (done) => {
        curatorRequest
            .put('/api/sources/5ea86423bae6982635d2e1f8')
            .send({
                name: 'test-source',
                origin: { url: 'http://foo.bar', license: 'MIT' },
            })
            .expect(404, done);
    });
    it('should be able to set a parser without schedule', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                automation: {
                    parser: {
                        awsLambdaArn:
                            'arn:aws:batch:eu-central-1:612888738066:job-definition:some-def',
                    },
                },
            })
            .expect(200, /arn/);
    });
    it('should return error if sending email notification fails, and still store the change', async () => {
        const id = new ObjectId();
        const recipients = ['foo@bar.com'];
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: recipients,
        });
        mockSend.mockReset();
        mockSend.mockRejectedValue({});
        await curatorRequest
            .put(`/api/sources/${id.toHexString()}`)
            .send({
                automation: {
                    schedule: { awsScheduleExpression: 'rate(1 hour)' },
                },
            })
            .expect(500, /NotificationSendError/);
        const updatedSourceRes = await curatorRequest
            .get(`/api/sources/${id.toHexString()}`)
            .expect(200);
        expect(updatedSourceRes.body.automation).toBeDefined();
    });
});

describe('POST', () => {
    it('should return the created source', async () => {
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever', license: 'MIT' },
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
    it('should create with exclusion from line list', async () => {
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever', license: 'MIT' },
            format: 'JSON',
            excludeFromLineList: true,
        };
        const res = await curatorRequest
            .post('/api/sources')
            .send(source)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(res.body.excludeFromLineList).toBeTruthy();
        expect(mockPutRule).not.toHaveBeenCalled();
    });
    it('should create an AWS rule with target if provided schedule expression', async () => {
        const scheduleExpression = 'rate(1 hour)';
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever', license: 'MIT' },
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
        const createdSource = await sources().findOne({ name: 'some_name' });
        expect(createdSource.automation.schedule.awsRuleArn).toBeDefined();
        expect(mockPutRule).toHaveBeenCalledWith(
            awsRuleNameForSource(createdSource),
            awsRuleDescriptionForSource(createdSource),
            scheduleExpression,
            undefined,
            awsRuleTargetIdForSource(createdSource),
            createdSource._id.toString(),
            awsStatementIdForSource(createdSource),
        );
    });
    it('should send a notification email if automation and recipients defined', async () => {
        const recipients = ['foo@bar.com'];
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: { awsScheduleExpression: 'rate(1 hour)' },
            },
            notificationRecipients: recipients,
        };
        await curatorRequest
            .post('/api/sources')
            .send(source)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(recipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if automation not defined', async () => {
        const source = {
            name: 'some_name',
            origin: { url: 'http://what.ever', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
        };
        await curatorRequest
            .post('/api/sources')
            .send(source)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(mockSend).not.toHaveBeenCalled();
    });
    it('should not create an incomplete source', async () => {
        await curatorRequest.post('/api/sources').send({}).expect(400);
    });
    it('should not create invalid source', async () => {
        await curatorRequest
            .post('/api/sources')
            .send({ origin: { url: 2 } })
            .expect(400);
    });
});

describe('DELETE', () => {
    it('should delete a source', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        await curatorRequest.delete(`/api/sources/${id.toHexString()}`).expect(204);
        expect(mockDeleteRule).not.toHaveBeenCalled();
    });
    it('should not delete a source where a case exists', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const aCase = await cases().insertOne({
            caseReference: {
                sourceId: id.toHexString(),
            },
        });
        await curatorRequest.delete(`/api/sources/${id.toHexString()}`).expect(403);
        expect(mockDeleteRule).not.toHaveBeenCalled();
    });
    it('should not delete a source where a restricted case exists', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        });
        const aCase = await restrictedCases().insertOne({
            caseReference: {
                sourceId: id.toHexString(),
            },
        });
        await curatorRequest.delete(`/api/sources/${id.toHexString()}`).expect(403);
        expect(mockDeleteRule).not.toHaveBeenCalled();
    });
    it('should delete corresponding AWS rule (et al.) if source contains ruleArn', async () => {
        const id = new ObjectId();
        const source = {
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(1 hour)',
                },
            },
        };
        await sources().insertOne(source);
        await curatorRequest.delete(`/api/sources/${id.toHexString()}`).expect(204);
        expect(mockDeleteRule).toHaveBeenCalledWith(
            awsRuleNameForSource(source as ISource),
            awsRuleTargetIdForSource(source as ISource),
            undefined,
            awsStatementIdForSource(source as ISource),
        );
    });
    it('should send a notification email if source contains ruleArn and recipients', async () => {
        const id = new ObjectId();
        const recipients = ['foo@bar.com'];
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: {
                    awsRuleArn: 'arn:aws:events:a:b:rule/c',
                    awsScheduleExpression: 'rate(1 hour)',
                },
            },
            notificationRecipients: recipients,
        });
        await curatorRequest.delete(`/api/sources/${id.toHexString()}`).expect(204);
        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(recipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if source did not have automation rule', async () => {
        const id = new ObjectId();
        await sources().insertOne({
            _id: id,
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
        });
        await curatorRequest.delete(`/api/sources/${id.toHexString()}`).expect(204);
        expect(mockSend).not.toHaveBeenCalled();
    });
    it('should not be able to delete a non existent source', (done) => {
        curatorRequest
            .delete('/api/sources/424242424242424242424242')
            .expect(404, done);
    });
});

describe('retrieval', () => {
    it('can be invoked', async () => {
        const sourceId = '424242424242424242424242';
        await curatorRequest
            .post(`/api/sources/${sourceId}/retrieve`)
            .expect(200);
        expect(mockDoRetrieval).toHaveBeenCalledWith(sourceId, undefined);
    });
    it('forwards optional date params', async () => {
        const sourceId = '424242424242424242424242';
        const startDate = '2020-09-01';
        const endDate = '2020-09-12';
        const parseRange = { start: startDate, end: endDate };
        await curatorRequest
            .post(
                `/api/sources/${sourceId}/retrieve?parse_start_date=${startDate}&parse_end_date=${endDate}`,
            )
            .expect(200);
        expect(mockDoRetrieval).toHaveBeenCalledWith(sourceId, parseRange);
    });
});
