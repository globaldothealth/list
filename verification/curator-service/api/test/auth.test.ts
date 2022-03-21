import * as core from 'express-serve-static-core';

import { AuthController, mustHaveAnyRole } from '../src/controllers/auth';
import { Request, Response } from 'express';
import { users, sessions } from '../src/model/user';

import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index';
import axios from 'axios';
import bodyParser from 'body-parser';
import express from 'express';
import passport from 'passport';
import request from 'supertest';
import supertest from 'supertest';
import MockLambdaClient from '../src/clients/aws-lambda-client';
import MockEmailClient from '../src/clients/email-client';

jest.mock('../src/clients/email-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: jest.fn().mockResolvedValue({}) };
    });
});

jest.mock('../src/clients/aws-lambda-client', () => {
    return jest.fn().mockImplementation(() => {
        return { initialize: jest.fn().mockResolvedValue({}) };
    });
});

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
let mongoServer: MongoMemoryServer;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

afterEach(async () => {
    await users().deleteMany({});
    await sessions().deleteMany({});
    jest.clearAllMocks();
});

describe('auth', () => {
    it('login with google', (done) => {
        // Redirected to the oauth consent screen.
        request(app).get('/auth/google').expect(302, done);
    });
    it('logout', (done) => {
        // Redirects to /
        request(app)
            .get('/auth/logout')
            .expect(302)
            .expect('Location', '/')
            .end(done);
    });
    it('handles redirect from google', (done) => {
        // Redirects to consent screen because not authenticated.
        request(app).get('/auth/google/redirect').expect(302, done);
    });
});

describe('local auth', () => {
    it('can access authenticated pages', async () => {
        // Create a user.
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-user',
                email: 'foo@bar.com',
            })
            .expect(200, /test-user/);
        request.get('/auth/profile').expect(200, /test-user/);
    });
});

describe('bearer token auth', () => {
    it('200s given properly scoped bearer token', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-user',
                email: 'foo@bar.com',
                roles: ['curator'],
            })
            .expect(200, /test-user/);
        await request.get('/auth/logout').expect(302);
        mockedAxios.get.mockResolvedValueOnce({
            data: { email: 'foo@bar.com' },
        });
        await request
            .get('/api/sources?access_token=mF_9.B5f-4.1JqM')
            .expect(200);
    });
    it('403s if token not scoped for email', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-user',
                email: 'foo@bar.com',
                roles: ['curator'],
            })
            .expect(200, /test-user/);
        await request.get('/auth/logout').expect(302);
        mockedAxios.get.mockResolvedValueOnce({
            data: { name: 'my name' },
        });
        await request
            .get('/api/sources?access_token=mF_9.B5f-4.1JqM')
            .expect(403);
    });
    it('500s if issue verifying token', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-user',
                email: 'foo@bar.com',
                roles: ['curator'],
            })
            .expect(200, /test-user/);
        await request.get('/auth/logout').expect(302);
        mockedAxios.get.mockRejectedValueOnce('Oops!');
        await request
            .get('/api/sources?access_token=mF_9.B5f-4.1JqM')
            .expect(500);
    });
});

describe('profile', () => {
    it('returns 403 when not authenticated', (done) => {
        request(app).get('/auth/profile').expect(403, done);
    });
});

describe('mustHaveAnyRole', () => {
    // Declaring a local app for this test not to depend on index.ts mappings.
    let localApp: core.Express;
    beforeAll(() => {
        // Setup a fake server.
        localApp = express();
        localApp.use(bodyParser.json());
        const mLambdaClient = new MockLambdaClient('', '', '');
        const mEmailClient = new MockEmailClient('', '', '', '', '');
        const authController = new AuthController(
            'local',
            '/redirect-after-login',
            mLambdaClient,
            mEmailClient,
        );
        authController.configurePassport('foo', 'bar');
        authController.configureLocalAuth();
        localApp.use(passport.initialize());
        localApp.use(passport.session());
        localApp.use('/auth', authController.router);
        localApp.get(
            '/mustbeadmin',
            mustHaveAnyRole(['admin']),
            (_req: Request, res: Response) => {
                res.sendStatus(200);
            },
        );
        localApp.get(
            '/tworoles',
            mustHaveAnyRole(['admin', 'curator']),
            (_req: Request, res: Response) => {
                res.sendStatus(200);
            },
        );
    });
    it('errors on unauthenticated request', (done) => {
        request(localApp).get('/mustbeadmin').expect(403, done);
    });
    it('errors when role does not match', async () => {
        const request = supertest.agent(localApp);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
                roles: ['curator'],
            })
            .expect(200, /test-curator/);
        request.get('/mustbeadmin').expect(403);
    });
    it('passes with proper roles', async () => {
        const request = supertest.agent(localApp);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator-admin',
                email: 'foo@bar.com',
                roles: ['curator', 'admin'],
            })
            .expect(200, /test-curator/);
        request.get('/mustbeadmin').expect(200);
    });
    it('passes with multiple roles specified', async () => {
        const request = supertest.agent(localApp);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
                roles: ['curator'],
            })
            .expect(200, /test-curator/);
        request.get('/tworoles').expect(200);
    });
    it('passes if bearer token has role if no user session', async () => {
        const request = supertest.agent(localApp);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator-admin',
                email: 'foo@bar.com',
                roles: ['curator', 'admin'],
            })
            .expect(200, /test-curator/);
        await request.get('/auth/logout').expect(302);
        mockedAxios.get.mockResolvedValueOnce({
            data: { email: 'foo@bar.com' },
        });
        await request
            .get('/mustbeadmin?access_token=mF_9.B5f-4.1JqM')
            .expect(200);
    });
    it('errors when user has no roles', async () => {
        const request = supertest.agent(localApp);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        request.get('/mustbeadmin').expect(403);
    });
});

describe('api keys', () => {
    it('must let a user update their API key', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        await request
            .post('/auth/profile/apiKey')
            .expect(201);
    });

    it('must let a user retrieve their API key', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        await request
            .post('/auth/profile/apiKey')
            .expect(201);
        await request
            .get('/auth/profile/apiKey')
            .expect(200);
    });

    it('does not find an API key where none has been set', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        await request
            .get('/auth/profile/apiKey')
            .expect(404);
    });

    it('lets the user get their profile by API key', async () => {
        const request = supertest.agent(app);
        await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        await request
            .post('/auth/profile/apiKey')
            .expect(201);
        const apiKey = await request
            .get('/auth/profile/apiKey');
        request.set('X-API-key', apiKey.body);
        await request.get('/auth/logout').expect(302);
        await request
            .get('/auth/profile')
            .expect(200, /test-curator/);
    });

    it("lets an admin delete another user's API key", async () => {
        const request = supertest.agent(app);
        const userRes = await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        await request
            .post('/auth/profile/apiKey')
            .expect(201);
        const apiKey = await request
            .get('/auth/profile/apiKey');
        await request.get('/auth/logout').expect(302);
        await request
            .post('/auth/register')
            .send({
                name: 'test-admin',
                email: 'admin@bar.com',
                roles: ['admin'],
            })
            .expect(200, /test-admin/);
        await request
            .post(`/auth/deleteApiKey/${userRes.body._id}`)
            .expect(204);
        // now try to use the API key
        await request.get('/auth/logout').expect(302);
        request.set('X-API-key', apiKey.body);
        await request
            .get('/auth/profile')
            .expect(403);
    });

    it("does not let a non-admin delete another user's API key", async () => {
        const request = supertest.agent(app);
        const userRes = await request
            .post('/auth/register')
            .send({
                name: 'test-curator',
                email: 'foo@bar.com',
            })
            .expect(200, /test-curator/);
        await request
            .post('/auth/profile/apiKey')
            .expect(201);
        const apiKey = await request
            .get('/auth/profile/apiKey');
        await request.get('/auth/logout').expect(302);
        await request
            .post('/auth/register')
            .send({
                name: 'test-not-admin',
                email: 'nimda@bar.com',
                roles: ['curator'],
            })
            .expect(200, /test-not-admin/);
        await request
            .post(`/auth/deleteApiKey/${userRes.body._id}`)
            .expect(403);
    });
});