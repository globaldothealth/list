import * as core from 'express-serve-static-core';

import { AuthController, mustHaveAnyRole } from '../src/controllers/auth';
import { Request, Response } from 'express';
import { Session, User } from '../src/model/user';

import app from '../src/index';
import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import request from 'supertest';
import supertest from 'supertest';

beforeAll(() => {
    return mongoose.connect(
        // This is provided by jest-mongodb.
        // The `else testurl` is to appease Typescript.
        process.env.MONGO_URL || 'testurl',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        },
    );
});

afterAll(() => {
    return mongoose.disconnect();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
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
        const authController = new AuthController('/redirect-after-login');
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
