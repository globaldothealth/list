import { User } from '../src/model/user';
import app from '../src/index';
import mongoose from 'mongoose';
import request from 'supertest';
const { MongoMemoryServer } = require('mongodb-memory-server');

beforeAll(async () => {
    // Needs to create a new DB so it does not intefere with local logins
    const uri = await (new MongoMemoryServer()).getConnectionString();
    return mongoose.connect(
        uri,
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
});

describe('GET', () => {
    it('list should return 200', async () => {
        const user = await new User({
            name: 'Alice Smith',
            email: 'foo@bar.com',
            googleID: 'testGoogleID',
            roles: ['curator', 'admin'],
        }).save();
        const res = await request(app)
            .get('/api/users')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(1);
        expect(res.body.users[0].googleID).toEqual(user.googleID);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
    });

    it('list should paginate', async () => {
        for (const i of Array.from(Array(15).keys())) {
            await new User({
                name: 'Alice Smith',
                email: 'foo@bar.com',
                googleID: `testGoogleID${i}`,
                roles: ['reader'],
            }).save();
        }
        // Fetch first page.
        let res = await request(app)
            .get('/api/users?page=1&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(10);
        // Second page is expected.
        expect(res.body.nextPage).toEqual(2);

        // Fetch second page.
        res = await request(app)
            .get(`/api/users?page=${res.body.nextPage}&limit=10`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(5);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);

        // Fetch inexistant page.
        res = await request(app)
            .get('/api/users?page=42&limit=10')
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body.users).toHaveLength(0);
        // No continuation expected.
        expect(res.body.nextPage).toBeUndefined();
        expect(res.body.total).toEqual(15);
    });

    it('rejects negative page param', (done) => {
        request(app).get('/api/users?page=-7').expect(422, done);
    });

    it('rejects negative limit param', (done) => {
        request(app).get('/api/users?page=1&limit=-2').expect(422, done);
    });
});
