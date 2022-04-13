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
import makeApp from '../src/index';
import axios from 'axios';
import supertest from 'supertest';
import { ObjectId } from 'mongodb';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/clients/aws-batch-client', () => {
    return jest.fn().mockImplementation(() => {
        return { doRetrieval: mockDoRetrieval };
    });
});

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    app = await makeApp();
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
    it('cannot update an nonexistent source', (done) => {
        curatorRequest
            .put('/api/sources/5ea86423bae6982635d2e1f8')
            .send({
                name: 'test-source',
                origin: { url: 'http://foo.bar', license: 'MIT' },
            })
            .expect(404, done);
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
