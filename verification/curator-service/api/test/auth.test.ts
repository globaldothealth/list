import app from '../src/index';
import mongoose from 'mongoose';
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
