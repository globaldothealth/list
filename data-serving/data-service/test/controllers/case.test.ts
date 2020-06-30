import { Case } from '../../src/model/case';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './../../src/index';
import minimalCase from './../model/data/case.minimal.json';
import request from 'supertest';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
});

beforeEach(() => {
    return Case.deleteMany({});
});

afterAll(async () => {
    return mongoServer.stop();
});

describe('GET', () => {
    it('one present item should return 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();

        const res = await request(app)
            .get(`/api/cases/${c._id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body._id).toEqual(c._id.toString());
    });
    it('one absent item should return 404 NOT FOUND', () => {
        return request(app)
            .get('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404);
    });
    describe('list', () => {
        it('should return 200 OK', () => {
            return request(app)
                .get('/api/cases')
                .expect('Content-Type', /json/)
                .expect(200);
        });
        it('should paginate', async () => {
            for (const i of Array.from(Array(15).keys())) {
                await new Case(minimalCase).save();
            }
            // Fetch first page.
            let res = await request(app)
                .get('/api/cases?page=1&limit=10')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(10);
            // Second page is expected.
            expect(res.body.nextPage).toEqual(2);
            expect(res.body.total).toEqual(15);

            // Fetch second page.
            res = await request(app)
                .get(`/api/cases?page=${res.body.nextPage}&limit=10`)
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(5);
            // No continuation expected.
            expect(res.body.nextPage).toBeUndefined();
            expect(res.body.total).toEqual(15);

            // Fetch inexistant page.
            res = await request(app)
                .get('/api/cases?page=42&limit=10')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(0);
            // No continuation expected.
            expect(res.body.nextPage).toBeUndefined();
        });
        it('should filter results', async () => {
            const c = new Case(minimalCase);
            c.notes = 'got it at work';
            await c.save();
            // Search for non-matching notes.
            let res = await request(app)
                .get('/api/cases?page=1&limit=10&filter=notes:home')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(0);
            expect(res.body.total).toEqual(0);
            // Search for matching notes.
            res = await request(app)
                .get('/api/cases?page=1&limit=10&filter=notes:work')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(1);
            expect(res.body.total).toEqual(1);
        });
        it('rejects negative page param', (done) => {
            request(app).get('/api/cases?page=-7').expect(422, done);
        });
        it('rejects negative limit param', (done) => {
            request(app).get('/api/cases?page=1&limit=-2').expect(422, done);
        });
    });
});

describe('POST', () => {
    it('create with invalid input should return 422', () => {
        return request(app).post('/api/cases').send({}).expect(422);
    });
    it('create with valid input should return 201 OK', async () => {
        return request(app)
            .post('/api/cases')
            .send(minimalCase)
            .expect('Content-Type', /json/)
            .expect(201);
    });
});

describe('PUT', () => {
    it('update present item should return 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ notes: newNotes })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.notes).toEqual(newNotes);
    });
    it('invalid update present item should return 422', async () => {
        const c = new Case(minimalCase);
        await c.save();

        return request(app)
            .put(`/api/cases/${c._id}`)
            .send({ location: {} })
            .expect(422);
    });
    it('update absent item should return 404 NOT FOUND', () => {
        return request(app)
            .put('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404);
    });
    it('upsert present item should return 200 OK', async () => {
        const c = new Case(minimalCase);
        const sourceId = 'abc123';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put('/api/cases')
            .send({
                caseReference: { sourceId: sourceId, sourceEntryId: entryId },
                notes: newNotes,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.notes).toEqual(newNotes);
        expect(await c.collection.countDocuments()).toEqual(1);
    });
    it('upsert new item should return 201 CREATED', async () => {
        return request(app)
            .put('/api/cases')
            .send(minimalCase)
            .expect('Content-Type', /json/)
            .expect(201);
    });
    it('upsert items without sourceEntryId should return 201 CREATED', async () => {
        const c = new Case(minimalCase);
        c.set('caseReference.sourceId', 'abc123');
        await c.save();

        const newCase = new Case(minimalCase);
        newCase.set('caseReference.sourceId', 'abc123');
        await request(app)
            .put('/api/cases')
            .send(newCase)
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await c.collection.countDocuments()).toEqual(2);
    });
    it('upsert new item with invalid input should return 422', () => {
        return request(app).put('/api/cases').send({}).expect(422);
    });
    it('invalid upsert present item should return 422', async () => {
        const c = new Case(minimalCase);
        const sourceId = 'abc123';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        return request(app)
            .put('/api/cases')
            .send({
                caseReference: { sourceId: sourceId, sourceEntryId: entryId },
                location: {},
            })
            .expect(422);
    });
});

describe('DELETE', () => {
    it('delete present item should return 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();

        return await request(app).delete(`/api/cases/${c._id}`).expect(204);
    });
    it('delete absent item should return 404 NOT FOUND', () => {
        return request(app)
            .delete('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404);
    });
});
