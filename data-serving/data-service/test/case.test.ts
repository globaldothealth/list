import request from 'supertest';
import app from '../src/index';
import mongoose from 'mongoose';
import { Case } from '../src/model/case';

beforeAll(() => {
    return mongoose.connect(
        // This is provided by jest-mongodb.
        // The `else testurl` is to appease Typescript.
        process.env.MONGO_URL || 'testurl',
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
});

beforeEach(() => {
    return Case.deleteMany({});
});

afterAll(() => {
    return mongoose.disconnect();
});

describe('GET', () => {
    it('one present item should return 200 OK', async () => {
        const id = '53cb6b9b4f4ddef1ad47f943';
        const c = new Case({ _id: id, outcome: 'pending', date: '2020-04-21' });
        await c.save();

        const res = await request(app)
            .get(`/api/cases/${id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body._id).toEqual(id);
    });
    it('one absent item should return 404 NOT FOUND', (done) => {
        request(app)
            .get('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404, done);
    });
    it('list should return 200 OK', (done) => {
        request(app)
            .get('/api/cases')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });
});

describe('POST', () => {
    it('create without valid date should return 422', (done) => {
        request(app)
            .post('/api/cases')
            .send({ date: 'not-a-date', outcome: 'recovered' })
            .expect(422, done);
    });
    it('create without valid outcome should return 422', (done) => {
        request(app)
            .post('/api/cases')
            .send({ date: '2020-04-01', outcome: 'not-a-valid-outcome' })
            .expect(422, done);
    });
    it('create with valid input should return 200 OK', async () => {
        const inputDate = new Date('2020-04-01').toJSON();
        const inputOutcome = 'recovered';
        const res = await request(app)
            .post('/api/cases')
            .send({ date: inputDate, outcome: inputOutcome })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.date).toEqual(inputDate);
        expect(res.body.outcome).toEqual(inputOutcome);
    });
});

describe('PUT', () => {
    it('update present item should return 200 OK', async () => {
        const id = '53cb6b9b4f4ddef1ad47f943';
        const c = new Case({ _id: id, outcome: 'pending', date: '2020-04-21' });
        await c.save();

        const newOutcome = 'recovered';
        const res = await request(app)
            .put('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .send({ outcome: newOutcome })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.outcome).toEqual(newOutcome);
    });
    it('update absent item should return 404 NOT FOUND', (done) => {
        request(app)
            .put('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404, done);
    });
});

describe('DELETE', () => {
    it('delete present item should return 200 OK', async () => {
        const id = '53cb6b9b4f4ddef1ad47f943';
        const c = new Case({ _id: id, outcome: 'pending', date: '2020-04-21' });
        await c.save();

        const res = await request(app)
            .delete(`/api/cases/${id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body._id).toEqual(id);
    });
    it('delete absent item should return 404 NOT FOUND', (done) => {
        request(app)
            .delete('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404, done);
    });
});
