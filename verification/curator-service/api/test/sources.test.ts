// These must be at the top of the file; jest hoists jest.mock() calls to the
// top of the file, and these must be defined prior to such calls.
const mockDeleteRule = jest.fn().mockResolvedValue({});
const mockPutRule = jest
    .fn()
    .mockResolvedValue('arn:aws:events:fake:event:rule/name');
const mockDoRetrieval = jest.fn().mockResolvedValue({ Payload: '' });
const mockSend = jest.fn();
const mockInitialize = jest.fn().mockResolvedValue({ send: mockSend });

import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { Source } from '../src/model/source';
import qs from 'qs';
import app from '../src/index';
import axios from 'axios';
import supertest from 'supertest';

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
        return { send: mockSend, initialize: mockInitialize };
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
    await Source.deleteMany({});
    await User.deleteMany({});
    await Session.deleteMany({});
});

afterEach(async () => {
    mockSend.mockReset();
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
        const source1 = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        const source2 = await new Source({
            name: 'another-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        const res = await curatorRequest
            .get('/api/sources')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.sources).toHaveLength(2);
        // Ordered by name.
        expect(res.body.sources[0]._id).toEqual(source2.id);
        expect(res.body.sources[1]._id).toEqual(source1.id);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
    });
    it('list should filter by url if supplied', async () => {
        const relevantSource = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        await new Source({
            name: 'test-source',
            origin: { url: 'http://bar.baz', license: 'MIT' },
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
                origin: { url: 'http://foo.bar', license: 'MIT' },
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
            origin: { url: 'http://foo.bar', license: 'MIT' },
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
            origin: { url: 'http://foo.bar', license: 'MIT' },
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
    it('should update a source line list exclusion', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        const res = await curatorRequest
            .put(`/api/sources/${source.id}`)
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
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        let res = await curatorRequest
            .put(`/api/sources/${source.id}`)
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
            .put(`/api/sources/${source.id}`)
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
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
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
            undefined,
            source.toAwsRuleTargetId(),
            source._id.toString(),
            source.toAwsStatementId(),
        );
    });
    it('should send a notification email if automation added and recipients defined', async () => {
        const recipients = ['foo@bar.com'];
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: recipients,
        }).save();
        await curatorRequest
            .put(`/api/sources/${source.id}`)
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
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: { awsScheduleExpression: 'rate(1 hour)' },
            },
            notificationRecipients: ['foo@bar.com'],
        }).save();
        const recipients = ['foo@bar.com'];
        await curatorRequest
            .put(`/api/sources/${source.id}`)
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
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            automation: {
                schedule: { awsScheduleExpression: 'rate(1 hour)' },
            },
            notificationRecipients: ['foo@bar.com'],
        }).save();
        await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({ format: 'CSV' })
            .expect(200)
            .expect('Content-Type', /json/);
        expect(mockSend).not.toHaveBeenCalled();
    });
    it('should update AWS rule description on source rename', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
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
                origin: { url: 'http://foo.bar', license: 'MIT' },
            })
            .expect(404, done);
    });
    it('should not update to an invalid source', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
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
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({
                automation: {
                    parser: {
                        awsLambdaArn:
                            'arn:aws:batch:us-east-1:612888738066:job-definition:some-def',
                    },
                },
            })
            .expect(200, /arn/);
    });
    it('should return error if sending email notification fails, and still store the change', async () => {
        const recipients = ['foo@bar.com'];
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: recipients,
        }).save();
        mockSend.mockReset();
        mockSend.mockRejectedValue({});
        await curatorRequest
            .put(`/api/sources/${source.id}`)
            .send({
                automation: {
                    schedule: { awsScheduleExpression: 'rate(1 hour)' },
                },
            })
            .expect(500, /NotificationSendError/);
        const updatedSourceRes = await curatorRequest
            .get(`/api/sources/${source.id}`)
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
        const createdSource = new Source(res.body);
        expect(createdSource.automation.schedule.awsRuleArn).toBeDefined();
        expect(mockPutRule).toHaveBeenCalledWith(
            createdSource.toAwsRuleName(),
            createdSource.toAwsRuleDescription(),
            scheduleExpression,
            undefined,
            createdSource.toAwsRuleTargetId(),
            createdSource._id.toString(),
            createdSource.toAwsStatementId(),
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
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
        }).save();
        await curatorRequest.delete(`/api/sources/${source.id}`).expect(204);
        expect(mockDeleteRule).not.toHaveBeenCalled();
    });
    it('should delete corresponding AWS rule (et al.) if source contains ruleArn', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
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
            undefined,
            source.toAwsStatementId(),
        );
    });
    it('should send a notification email if source contains ruleArn and recipients', async () => {
        const recipients = ['foo@bar.com'];
        const source = await new Source({
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
        }).save();
        await curatorRequest.delete(`/api/sources/${source.id}`).expect(204);
        expect(mockSend).toHaveBeenCalledWith(
            expect.arrayContaining(recipients),
            expect.anything(),
            expect.anything(),
        );
    });
    it('should not send a notification email if source did not have automation rule', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
        }).save();
        await curatorRequest.delete(`/api/sources/${source.id}`).expect(204);
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

describe('marking sources for deletion', () => {
    it('requires the source not to have stable IDs', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
            hasStableIdentifiers: true,
        }).save();
        await curatorRequest.post(
            `/api/sources/${source._id}/markPendingRemoval`
        )
        .expect(400);
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('forwards request to mark sources to the data service', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
        });
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
            hasStableIdentifiers: false,
        }).save();
        await curatorRequest.post(
            `/api/sources/${source._id}/markPendingRemoval`
        )
        .expect(201);
        expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/api/cases/markPendingRemoval',
            qs.stringify({sourceId: `${source._id}`, email: baseUser.email}));
    });
});

describe('clearing pending-deletion flag', () => {
    it('requires the source not to have stable IDs', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
            hasStableIdentifiers: true,
        }).save();
        await curatorRequest.post(
            `/api/sources/${source._id}/clearPendingRemovalStatus`
        )
        .expect(400);
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('forwards request to clear mark to the data service', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
        });
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
            hasStableIdentifiers: false,
        }).save();
        await curatorRequest.post(
            `/api/sources/${source._id}/clearPendingRemovalStatus`
        )
        .expect(201);
        expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/api/cases/clearPendingRemovalStatus',
            qs.stringify({sourceId: `${source._id}`, email: baseUser.email}));
    });
});

describe('deleting pending cases for a source', () => {
    it('requires the source not to have stable IDs', async () => {
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
            hasStableIdentifiers: true,
        }).save();
        await curatorRequest.post(
            `/api/sources/${source._id}/removePendingCases`
        )
        .expect(400);
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('forwards request to remove cases to the data service', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
        });
        const source = await new Source({
            name: 'test-source',
            origin: { url: 'http://foo.bar', license: 'MIT' },
            format: 'JSON',
            notificationRecipients: ['foo@bar.com'],
            hasStableIdentifiers: false,
        }).save();
        await curatorRequest.post(
            `/api/sources/${source._id}/removePendingCases`
        )
        .expect(201);
        expect(mockedAxios.post).toHaveBeenCalledWith(`http://localhost:3000/api/cases/removePendingCases`, `sourceId=${source._id}`);
    });
});
