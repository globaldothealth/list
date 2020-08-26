import { Case } from '../../src/model/case';
import { CaseRevision } from '../../src/model/case-revision';
import { Demographics } from '../../src/model/demographics';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './../../src/index';
import fullCase from './../model/data/case.full.json';
import minimalCase from './../model/data/case.minimal.json';
import mongoose from 'mongoose';
import request from 'supertest';

let mongoServer: MongoMemoryServer;

const curatorMetadata = { curator: { email: 'abc@xyz.com' } };

const minimalRequest = {
    ...minimalCase,
    ...curatorMetadata,
};

const invalidRequest = {
    ...minimalRequest,
    demographics: { ageRange: { start: 400 } },
};

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
});

beforeEach(async () => {
    await Case.deleteMany({});
    return CaseRevision.deleteMany({});
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
            const now = new Date('2020-01-01');
            for (const i of Array.from(Array(15).keys())) {
                const c = new Case(minimalCase);
                c.revisionMetadata.creationMetadata.set({
                    date: now.setHours(i),
                });
                await c.save();
            }
            // Fetch first page.
            let res = await request(app)
                .get('/api/cases?page=1&limit=10')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(10);
            // Results should be ordered by date desc.
            for (let i = 0; i < res.body.cases.length - 1; i++) {
                expect(
                    res.body.cases[i].revisionMetadata.creationMetadata.date >
                        res.body.cases[i + 1].revisionMetadata.creationMetadata
                            .date,
                ).toBeTruthy();
            }
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
        it('should query results', async () => {
            // Simulate index creation used in unit tests, in production they are
            // setup by the setup-db script and such indexes are not present by
            // default in the in memory mongo spawned by unit tests.
            await mongoose.connection.collection('cases').createIndex({
                notes: 'text',
            });

            const c = new Case(minimalCase);
            c.notes = 'got it at work';
            await c.save();
            // Search for non-matching notes.
            const res = await request(app)
                .get('/api/cases?page=1&limit=10&q=home')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(0);
            expect(res.body.total).toEqual(0);
            // Search for matching notes.
            await request(app)
                .get(`/api/cases?page=1&limit=10&q=${encodeURI('at work')}`)
                .expect(200, /got it at work/)
                .expect('Content-Type', /json/);
        });
        describe('keywords', () => {
            beforeEach(async () => {
                const c = new Case(minimalCase);
                c.location.country = 'Germany';
                c.set('demographics.occupation', 'engineer');
                await c.save();
            });
            it('returns no case if no match', async () => {
                const res = await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3ASwitzerland')
                    .expect(200)
                    .expect('Content-Type', /json/);
                expect(res.body.cases).toHaveLength(0);
                expect(res.body.total).toEqual(0);
            });
            it('returns the case if keyword matches', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3AGermany')
                    .expect(200, /Germany/)
                    .expect('Content-Type', /json/);
            });
            it('Search for matching country and something else that does not match', async () => {
                const res = await request(app)
                    .get(
                        '/api/cases?page=1&limit=1&q=country%3AGermany%occupation%3Anope',
                    )
                    .expect(200)
                    .expect('Content-Type', /json/);
                expect(res.body.cases).toHaveLength(0);
                expect(res.body.total).toEqual(0);
            });
            it('Search for matching country and something else that also matches', async () => {
                await request(app)
                    .get(
                        '/api/cases?page=1&limit=1&q=country%3AGermany%20occupation%3Aengineer',
                    )
                    .expect(200, /engineer/)
                    .expect('Content-Type', /json/);
            });
            it('Search for multiple occurrences of the same keyword', async () => {
                await request(app)
                    .get(
                        '/api/cases?page=1&limit=1&q=country%3AGermany%20country%3APeru',
                    )
                    .expect(200, /Germany/)
                    .expect('Content-Type', /json/);
            });
        });
        it('rejects negative page param', (done) => {
            request(app).get('/api/cases?page=-7').expect(400, done);
        });
        it('rejects negative limit param', (done) => {
            request(app).get('/api/cases?page=1&limit=-2').expect(400, done);
        });
    });

    describe('list symptoms', () => {
        it('should return 200 OK', () => {
            return request(app).get('/api/cases/symptoms?limit=5').expect(200);
        });
        it('should show most frequently used symptoms', async () => {
            for (let i = 1; i <= 5; i++) {
                const c = new Case(minimalCase);
                c.set({
                    symptoms: {
                        values: Array.from(
                            Array(i),
                            (_, index) => `symptom${index + 1}`,
                        ),
                    },
                });
                await c.save();
            }
            const res = await request(app)
                .get('/api/cases/symptoms?limit=3')
                .expect(200);
            expect(res.body.symptoms).toEqual([
                'symptom1',
                'symptom2',
                'symptom3',
            ]);
        });
        it('rejects negative limit param', (done) => {
            request(app).get('/api/cases/symptoms?limit=-2').expect(400, done);
        });
    });

    describe('list places of transmission', () => {
        it('should return 200 OK', () => {
            return request(app)
                .get('/api/cases/placesOfTransmission?limit=5')
                .expect(200);
        });
        it('should show most frequently used places of transmission', async () => {
            for (let i = 1; i <= 5; i++) {
                const c = new Case(minimalCase);
                c.set({
                    transmission: {
                        places: Array.from(
                            Array(i),
                            (_, index) => `place of transmission ${index + 1}`,
                        ),
                    },
                });
                await c.save();
            }
            const res = await request(app)
                .get('/api/cases/placesOfTransmission?limit=3')
                .expect(200);
            expect(res.body.placesOfTransmission).toEqual([
                'place of transmission 1',
                'place of transmission 2',
                'place of transmission 3',
            ]);
        });
        it('rejects negative limit param', (done) => {
            request(app)
                .get('/api/cases/placesOfTransmission?limit=-2')
                .expect(400, done);
        });
    });

    describe('list occupations', () => {
        it('should return 200 OK', () => {
            return request(app)
                .get('/api/cases/occupations?limit=5')
                .expect(200);
        });
        it('should show most frequently used occupations', async () => {
            for (let i = 1; i <= 4; i++) {
                const c = new Case(minimalCase);
                c.set({
                    demographics: {
                        occupation: 'occupation 1',
                    },
                });
                await c.save();
            }
            for (let i = 1; i <= 3; i++) {
                const c = new Case(minimalCase);
                c.set({
                    demographics: {
                        occupation: 'occupation 2',
                    },
                });
                await c.save();
            }
            for (let i = 1; i <= 2; i++) {
                const c = new Case(minimalCase);
                c.set({
                    demographics: {
                        occupation: 'occupation 3',
                    },
                });
                await c.save();
            }
            const c = new Case(minimalCase);
            c.set({
                demographics: {
                    occupation: 'occupation 4',
                },
            });
            await c.save();
            const res = await request(app)
                .get('/api/cases/occupations?limit=3')
                .expect(200);
            expect(res.body.occupations).toEqual([
                'occupation 1',
                'occupation 2',
                'occupation 3',
            ]);
        });
        it('rejects negative limit param', (done) => {
            request(app)
                .get('/api/cases/occupations?limit=-2')
                .expect(400, done);
        });
    });
});

describe('POST', () => {
    it('create with input missing required properties should return 400', () => {
        return request(app).post('/api/cases').send({}).expect(400);
    });
    it('create with required properties but invalid input should return 422', () => {
        return request(app).post('/api/cases').send(invalidRequest).expect(422);
    });
    it('rejects negative num_cases param', () => {
        return request(app)
            .post('/api/cases?num_cases=-2')
            .send(minimalRequest)
            .expect(400);
    });
    it('create with valid input should return 201 OK', async () => {
        await request(app)
            .post('/api/cases')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(await Case.collection.countDocuments()).toEqual(1);
    });
    it('create many cases with valid input should return 201 OK', async () => {
        const res = await request(app)
            .post('/api/cases?num_cases=3')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(res.body.cases).toHaveLength(3);
        expect(await Case.collection.countDocuments()).toEqual(3);
    });
    it('create with valid input should result in correct creation metadata', async () => {
        const res = await request(app)
            .post('/api/cases')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.revisionMetadata.revisionNumber).toEqual(0);
        expect(res.body.revisionMetadata.creationMetadata.curator).toEqual(
            minimalRequest.curator.email,
        );
        expect(res.body).not.toHaveProperty('curator');
    });
    it('create with valid input should not create case revision', async () => {
        await request(app)
            .post('/api/cases')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('create with input missing required properties and validate_only should return 400', async () => {
        return request(app)
            .post('/api/cases?validate_only=true')
            .send({})
            .expect(400);
    });
    it('create with valid input and validate_only should not save case', async () => {
        const res = await request(app)
            .post('/api/cases?validate_only=true')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await Case.collection.countDocuments()).toEqual(0);
        expect(res.body._id).not.toHaveLength(0);
    });
    it('batch upsert with no body should return 415', () => {
        return request(app).post('/api/cases/batchUpsert').expect(415);
    });
    it('batch upsert with no cases should return 400', () => {
        return request(app).post('/api/cases/batchUpsert').send({}).expect(400);
    });
    it('batch upsert with only valid cases should return 207 with IDs', async () => {
        const newCaseWithoutEntryId = new Case(minimalCase);
        const newCaseWithEntryId = new Case(fullCase);
        newCaseWithEntryId.caseReference.sourceEntryId = 'newId';

        const existingCaseWithEntryId = new Case(fullCase);
        await existingCaseWithEntryId.save();
        existingCaseWithEntryId.notes = 'new notes';

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    newCaseWithoutEntryId,
                    newCaseWithEntryId,
                    existingCaseWithEntryId,
                ],
                ...curatorMetadata,
            })
            .expect(207);
        expect(res.body.createdCaseIds).toHaveLength(2);
        expect(res.body.updatedCaseIds).toHaveLength(1);
        const updatedCaseInDb = await Case.findById(res.body.updatedCaseIds[0]);
        expect(updatedCaseInDb?.notes).toEqual(existingCaseWithEntryId.notes);
    });
    it('batch upsert should result in create and update metadata', async () => {
        const existingCase = new Case(fullCase);
        await existingCase.save();
        existingCase.notes = 'new notes';

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [existingCase, minimalCase],
                ...curatorMetadata,
            });

        const newCaseInDb = await Case.findById(res.body.createdCaseIds[0]);
        expect(newCaseInDb?.revisionMetadata.revisionNumber).toEqual(0);
        expect(newCaseInDb?.revisionMetadata.creationMetadata.curator).toEqual(
            curatorMetadata.curator.email,
        );

        const updatedCaseInDb = await Case.findById(res.body.updatedCaseIds[0]);
        expect(updatedCaseInDb?.revisionMetadata.revisionNumber).toEqual(1);
        expect(
            updatedCaseInDb?.revisionMetadata.updateMetadata?.curator,
        ).toEqual(curatorMetadata.curator.email);
        expect(
            updatedCaseInDb?.revisionMetadata.creationMetadata.curator,
        ).toEqual(minimalCase.revisionMetadata.creationMetadata.curator);

        expect(res.body).not.toHaveProperty('curator');
    });
    it('batch upsert should result in case revisions of existing cases', async () => {
        const existingCase = new Case(fullCase);
        await existingCase.save();
        existingCase.notes = 'new notes';

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [existingCase, minimalCase],
                ...curatorMetadata,
            });

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
    });
    it('batch upsert with any invalid case should return 422', async () => {
        await request(app)
            .post('/api/cases/batchUpsert')
            .send({ cases: [minimalCase, invalidRequest], ...curatorMetadata })
            .expect(422);
    });
    it('batch validate with no body should return 415', () => {
        return request(app).post('/api/cases/batchValidate').expect(415);
    });
    it('batch validate with no cases should return 400', () => {
        return request(app)
            .post('/api/cases/batchValidate')
            .send({})
            .expect(400);
    });
    it('batch validate with empty cases should return empty 207', async () => {
        const res = await request(app)
            .post('/api/cases/batchValidate')
            .send({ cases: [] })
            .expect(207);
        expect(res.body.errors).toHaveLength(0);
    });
    it('batch validate with only valid cases should return empty 207', async () => {
        const res = await request(app)
            .post('/api/cases/batchValidate')
            .send({ cases: [minimalCase] })
            .expect(207);
        expect(res.body.errors).toHaveLength(0);
    });
    it('batch validate returns errors for invalid cases in 207', async () => {
        const res = await request(app)
            .post('/api/cases/batchValidate')
            .send({ cases: [minimalRequest, invalidRequest] })
            .expect(207);
        expect(res.body.errors).toHaveLength(1);
        expect(res.body.errors[0].index).toBe(1);
        expect(res.body.errors[0].message).toMatch('Case validation failed');
    });
});

describe('PUT', () => {
    it('update present item should return 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, notes: newNotes })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.notes).toEqual(newNotes);
    });
    it('update present item should result in update metadata', async () => {
        const c = new Case(minimalCase);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, notes: newNotes })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.revisionMetadata.revisionNumber).toEqual(1);
        expect(res.body.revisionMetadata.updateMetadata.curator).toEqual(
            curatorMetadata.curator.email,
        );
        expect(res.body.revisionMetadata.creationMetadata).toEqual(
            minimalCase.revisionMetadata.creationMetadata,
        );
        expect(res.body).not.toHaveProperty('curator');
    });
    it('update present item should create case revision', async () => {
        const c = new Case(minimalCase);
        await c.save();

        const newNotes = 'abc';
        await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, notes: newNotes })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
    });
    it('invalid update present item should return 422', async () => {
        const c = new Case(minimalCase);
        await c.save();

        return request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, location: {} })
            .expect(422);
    });
    it('update absent item should return 404 NOT FOUND', () => {
        return request(app)
            .put('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .send(curatorMetadata)
            .expect(404);
    });
    it('upsert present item should return 200 OK', async () => {
        const c = new Case(minimalCase);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                },
                notes: newNotes,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.notes).toEqual(newNotes);
        expect(await c.collection.countDocuments()).toEqual(1);
    });
    it('upsert present item should result in update metadata', async () => {
        const c = new Case(minimalCase);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                },
                notes: newNotes,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.revisionMetadata.revisionNumber).toEqual(1);
        expect(res.body.revisionMetadata.updateMetadata.curator).toEqual(
            curatorMetadata.curator.email,
        );
        expect(res.body.revisionMetadata.creationMetadata).toEqual(
            minimalCase.revisionMetadata.creationMetadata,
        );
        expect(res.body).not.toHaveProperty('curator');
    });
    it('upsert present item should create case revision', async () => {
        const c = new Case(minimalCase);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                },
                notes: newNotes,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);
    });

    it('upsert present item should result in update metadata', async () => {
        const c = new Case(minimalCase);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newNotes = 'abc';
        const res = await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                },
                notes: newNotes,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
    });
    it('upsert new item should return 201 CREATED', async () => {
        return request(app)
            .put('/api/cases')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);
    });
    it('upsert new item should result in creation metadata', async () => {
        const res = await request(app)
            .put('/api/cases')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.revisionMetadata.revisionNumber).toEqual(0);
        expect(res.body.revisionMetadata.creationMetadata.curator).toEqual(
            minimalRequest.curator.email,
        );
        expect(res.body).not.toHaveProperty('curator');
    });
    it('upsert new item should not create a case revision', async () => {
        const res = await request(app)
            .put('/api/cases')
            .send(minimalRequest)
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('upsert items without sourceEntryId should return 201 CREATED', async () => {
        // NB: Minimal case does not have a sourceEntryId.
        const firstUniqueCase = new Case(minimalCase);
        await firstUniqueCase.save();

        await request(app)
            .put('/api/cases')
            .send({ ...minimalCase, ...curatorMetadata })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await Case.collection.countDocuments()).toEqual(2);
    });
    it('upsert new item without required fields should return 400', () => {
        return request(app).put('/api/cases').send({}).expect(400);
    });
    it('upsert new item with invalid input should return 422', () => {
        return request(app).put('/api/cases').send(invalidRequest).expect(422);
    });
    it('invalid upsert present item should return 422', async () => {
        const c = new Case(minimalCase);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        return request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                },
                location: {},
                ...curatorMetadata,
            })
            .expect(422);
    });
});

describe('DELETE', () => {
    it('delete present item should return 204 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();

        return await request(app).delete(`/api/cases/${c._id}`).expect(204);
    });
    it('delete absent item should return 404 NOT FOUND', () => {
        return request(app)
            .delete('/api/cases/53cb6b9b4f4ddef1ad47f943')
            .expect(404);
    });
    it('delete multiple cases cannot specify caseIds and query', async () => {
        const c = await new Case(minimalCase).save();
        const c2 = await new Case(minimalCase).save();
        expect(await Case.collection.countDocuments()).toEqual(2);

        await request(app)
            .delete('/api/cases')
            .send({ caseIds: [c._id, c2._id], query: 'test' })
            .expect(400);
    });
    it('delete multiple cases cannot send without request body', async () => {
        await request(app).delete('/api/cases').expect(415);
    });
    it('delete multiple cases cannot send empty request body', async () => {
        await request(app).delete('/api/cases').send({}).expect(400);
    });
    it('delete multiple cases cannot send empty query', async () => {
        await request(app).delete('/api/cases').send({ query: '' }).expect(400);
    });
    it('delete multiple cases cannot send whitespace only query', async () => {
        await request(app)
            .delete('/api/cases')
            .send({ query: ' ' })
            .expect(400);
    });
    it('delete multiple cases with caseIds should return 204 OK', async () => {
        const c = await new Case(minimalCase).save();
        const c2 = await new Case(minimalCase).save();
        expect(await Case.collection.countDocuments()).toEqual(2);

        await request(app)
            .delete('/api/cases')
            .send({ caseIds: [c._id, c2._id] })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(0);
    });
    it('delete multiple cases with query should return 204 OK', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the setup-db script and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        await mongoose.connection.collection('cases').createIndex({
            notes: 'text',
        });

        const c = new Case(minimalCase);
        c.notes = 'got it at work';
        c.demographics = new Demographics({ gender: 'Female' });
        await c.save();
        const c2 = new Case(minimalCase);
        c2.demographics = new Demographics({ gender: 'Female' });
        await c2.save();
        await new Case(minimalCase).save();
        expect(await Case.collection.countDocuments()).toEqual(3);

        // Unmatched query deletes no cases
        await request(app)
            .delete('/api/cases')
            .send({ query: 'at home' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(3);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'at work gender:Male' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(3);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Male' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(3);

        // Deletes matched queries
        await request(app)
            .delete('/api/cases')
            .send({ query: 'at work gender:Female' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(2);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Female' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(1);
    });
});
