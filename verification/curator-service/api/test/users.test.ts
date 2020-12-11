import * as baseUser from './users/base.json';

import { Session, User } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import supertest from 'supertest';

jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: jest.fn().mockResolvedValue({}) };
    });
});

let mongoServer: MongoMemoryServer;
beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
    jest.clearAllMocks();
});

afterAll(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
    return mongoServer.stop();
});

describe('GET', () => {
    let adminRequest: any;
    beforeEach(async () => {
        adminRequest = supertest.agent(app);
        await adminRequest
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['admin'] } })
            .expect(200);
    });

    it('list roles should return roles', async () => {
        const res = await adminRequest
            .get('/api/users/roles')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.roles).toEqual(['admin', 'curator']);
    });

    it('list should return 200', async () => {
        const res = await adminRequest
            .get('/api/users')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(1);
        expect(res.body.users[0].roles).toEqual(['admin']);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
    });

    it('list should paginate', async () => {
        for (const i of Array.from(Array(14).keys())) {
            await new User({
                name: 'Alice Smith',
                email: 'foo@bar.com',
                googleID: `testGoogleID${i}`,
                roles: ['curator'],
            }).save();
        }
        // Fetch first page as an admin.
        let res = await adminRequest
            .get('/api/users?page=1&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(10);
        // Second page is expected.
        expect(res.body.nextPage).toEqual(2);

        // Fetch second page.
        res = await adminRequest
            .get(`/api/users?page=${res.body.nextPage}&limit=10`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(5);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);

        // Fetch inexistant page.
        res = await adminRequest
            .get('/api/users?page=42&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(0);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);
    });

    it('rejects negative page param', async () => {
        return adminRequest.get('/api/users?page=-7').expect(400);
    });

    it('rejects negative limit param', async () => {
        return adminRequest.get('/api/users?page=1&limit=-2').expect(400);
    });
});

describe('PUT', () => {
    it('should update roles', async () => {
        const request = supertest.agent(app);
        const userRes = await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['admin'] } })
            .expect(200, /admin/)
            .expect('Content-Type', /json/);
        const res = await request
            .put(`/api/users/${userRes.body._id}`)
            .send({ roles: ['admin', 'curator'] })
            .expect(200, /curator/)
            .expect('Content-Type', /json/);
        // Check what changed.
        expect(res.body.roles).toEqual(['admin', 'curator']);
        // Check stuff that didn't change.
        expect(res.body.email).toEqual(userRes.body.email);
    });
    it('cannot update an nonexistent user', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['admin'] } })
            .expect(200)
            .expect('Content-Type', /json/);
        return request
            .put('/api/users/5ea86423bae6982635d2e1f8')
            .send({ ...baseUser, ...{ roles: ['admin'] } })
            .expect(404);
    });
    it('should not update to an invalid role', async () => {
        const request = supertest.agent(app);
        const userRes = await request
            .post('/auth/register')
            .send({ ...baseUser, ...{ roles: ['admin'] } })
            .expect(200)
            .expect('Content-Type', /json/);
        return request
            .put(`/api/users/${userRes.body._id}`)
            .send({ roles: ['invalidRole'] })
            .expect(400);
    });
});
