import { Case } from '../../src/model/case';
import { CaseRevision } from '../../src/model/case-revision';
import { Demographics } from '../../src/model/demographics';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './../../src/index';
import fullCase from './../model/data/case.full.json';
import minimalCase from './../model/data/case.minimal.json';
import caseMustGeocode from './../model/data/case.mustgeocode.json';
import mongoose from 'mongoose';
import request from 'supertest';
import { setupServer } from 'msw/node';
import {
    seed as seedFakeGeocodes,
    clear as clearFakeGeocodes,
    handlers,
} from '../mocks/handlers';

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

const realDate = Date.now;
const mockLocationServer = setupServer(...handlers);

beforeAll(async () => {
    mockLocationServer.listen();
    mongoServer = new MongoMemoryServer();
    global.Date.now = jest.fn(() => new Date('2020-12-12T12:12:37Z').getTime());
});

beforeEach(async () => {
    clearFakeGeocodes();
    await Case.deleteMany({});
    return CaseRevision.deleteMany({});
});

afterEach(() => {
    mockLocationServer.resetHandlers();
});

afterAll(async () => {
    mockLocationServer.close();
    global.Date.now = realDate;
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

        expect(res.body[0]._id).toEqual(c._id.toString());
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
                .get('/api/cases?page=1&limit=10&sort_by=0')
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
                c.set('variant.name', 'B.1.1.7');
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
            it('returns the case if matches', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3AGermany')
                    .expect(200, /Germany/)
                    .expect('Content-Type', /json/);
            });
            it('returns the case if variant matches', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=variant%3AB.1.1.7')
                    .expect(200, /Germany/)
                    .expect('Content-Type', /json/);
            });
            it('returns the case on wildcard variant check', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=variant%3A%2A')
                    .expect(200, /Germany/)
                    .expect('Content-Type', /json/);
            });
            it('returns no case if no wildcard match', async () => {
                const res = await request(app)
                    .get('/api/cases?page=1&limit=1&q=admin3%3A%2A')
                    .expect('Content-Type', /json/);
                expect(res.body.cases).toHaveLength(0);
                expect(res.body.total).toEqual(0);
            });
            it('returns the case if non case sensitive matches', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3Agermany')
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
        it('rejects invalid searches', (done) => {
            request(app).get('/api/cases?q=country%3A').expect(422, done);
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
    it('batch upsert with only valid cases should return 200 with counts', async () => {
        const newCaseWithoutEntryId = new Case(minimalCase);
        const newCaseWithEntryId = new Case(fullCase);
        newCaseWithEntryId.caseReference.sourceEntryId = 'newId';

        const changedCaseWithEntryId = new Case(fullCase);
        await changedCaseWithEntryId.save();
        changedCaseWithEntryId.notes = 'new notes';

        const unchangedCaseWithEntryId = new Case(fullCase);
        unchangedCaseWithEntryId.caseReference.sourceEntryId =
            'unchangedEntryId';
        await unchangedCaseWithEntryId.save();

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    newCaseWithoutEntryId,
                    newCaseWithEntryId,
                    changedCaseWithEntryId,
                    unchangedCaseWithEntryId,
                ],
                ...curatorMetadata,
            })
            .expect(200);

        const unchangedDbCase = await Case.findById(
            unchangedCaseWithEntryId._id,
        );
        expect(unchangedDbCase?.toJSON()).toEqual(
            unchangedCaseWithEntryId.toJSON(),
        );
        expect(res.body.numCreated).toBe(2); // Both new cases were created.
        expect(res.body.numUpdated).toBe(1); // Only changed case was updated.

        const updatedCaseInDb = await Case.findById(changedCaseWithEntryId._id);
        expect(updatedCaseInDb?.notes).toEqual(changedCaseWithEntryId.notes);
    });
    it('batch upsert should add uploadId to field array', async () => {
        const newUploadIds = ['012301234567890123456789'];

        const newCaseWithoutEntryId = new Case(minimalCase);
        newCaseWithoutEntryId.caseReference.uploadIds = newUploadIds;
        const newCaseWithEntryId = new Case(fullCase);
        newCaseWithEntryId.caseReference.sourceEntryId = 'newId';
        newCaseWithEntryId.caseReference.uploadIds = newUploadIds;

        const changedCaseWithEntryId = new Case(fullCase);
        await changedCaseWithEntryId.save();
        changedCaseWithEntryId.caseReference.uploadIds = newUploadIds;
        changedCaseWithEntryId.notes = 'new notes';

        const unchangedCaseWithEntryId = new Case(fullCase);
        unchangedCaseWithEntryId.caseReference.sourceEntryId =
            'unchangedEntryId';
        const unchangedCaseUploadIds =
            unchangedCaseWithEntryId.caseReference.uploadIds;
        await unchangedCaseWithEntryId.save();
        unchangedCaseWithEntryId.caseReference.uploadIds = newUploadIds;

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    newCaseWithoutEntryId,
                    newCaseWithEntryId,
                    changedCaseWithEntryId,
                    unchangedCaseWithEntryId,
                ],
                ...curatorMetadata,
            })
            .expect(200);

        const unchangedDbCase = await Case.findById(
            unchangedCaseWithEntryId._id,
        );
        // Upload ids were not changed for unchanged case.
        expect(unchangedDbCase?.caseReference?.uploadIds).toHaveLength(2);
        expect(unchangedDbCase?.caseReference?.uploadIds[0]).toEqual(
            unchangedCaseUploadIds[0],
        );
        expect(unchangedDbCase?.caseReference?.uploadIds[1]).toEqual(
            unchangedCaseUploadIds[1],
        );
        expect(res.body.numCreated).toBe(2); // Both new cases were created.
        expect(res.body.numUpdated).toBe(1); // Only changed case was updated.

        // Upload ids were added for changed case.
        const changedDbCase = await Case.findById(changedCaseWithEntryId._id);
        expect(changedDbCase?.caseReference?.uploadIds).toHaveLength(3);
        expect(changedDbCase?.caseReference?.uploadIds[0]).toEqual(
            newUploadIds[0],
        );
        expect(changedDbCase?.caseReference?.uploadIds[1]).toEqual(
            unchangedCaseUploadIds[0],
        );
        expect(changedDbCase?.caseReference?.uploadIds[2]).toEqual(
            unchangedCaseUploadIds[1],
        );
    });
    it('geocodes everything that is necessary', async () => {
        seedFakeGeocodes('Canada', {
            country: 'Canada',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });
        seedFakeGeocodes('Montreal', {
            administrativeAreaLevel1: 'Quebec',
            country: 'Canada',
            geoResolution: 'Admin1',
            geometry: { latitude: 33.33, longitude: 99.99 },
            name: 'Montreal',
        });
        await request(app)
            .post('/api/cases')
            .send({
                ...caseMustGeocode,
                ...curatorMetadata,
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(
            await Case.collection.findOne({ 'location.name': 'Canada' }),
        ).toBeDefined();
        expect(
            await Case.collection.findOne({
                'travelHistory.travel[0].location.name': 'Montreal',
            }),
        ).toBeDefined();
    });
    it('throws if cannot geocode', async () => {
        await request(app)
            .post('/api/cases')
            .send({
                ...caseMustGeocode,
                ...curatorMetadata,
            })
            .expect(404, /Geocode not found/)
            .expect('Content-Type', /json/);
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

        const newCaseInDb = await Case.findOne({
            'revisionMetadata.revisionNumber': 0,
        });
        expect(newCaseInDb?.revisionMetadata.creationMetadata.curator).toEqual(
            curatorMetadata.curator.email,
        );

        const updatedCaseInDb = await Case.findOne({
            'revisionMetadata.revisionNumber': 1,
        });
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
    it('batch upsert for unchanged case skips creating metadata and revision', async () => {
        const existingCase = new Case(fullCase);
        await existingCase.save();

        await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [existingCase],
                ...curatorMetadata,
            })
            .expect(200);

        const caseInDb = await Case.findById(existingCase._id);
        expect(caseInDb?.revisionMetadata.revisionNumber).toEqual(0);
        expect(caseInDb?.revisionMetadata.creationMetadata.curator).toEqual(
            minimalCase.revisionMetadata.creationMetadata.curator,
        );
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('batch upsert with any invalid case should return 207', async () => {
        await request(app)
            .post('/api/cases/batchUpsert')
            .send({ cases: [minimalCase, invalidRequest], ...curatorMetadata })
            .expect(207, /VALIDATE/);
    });
    it('batch upsert with empty cases should return 400', async () => {
        return request(app)
            .post('/api/cases/batchUpsert')
            .send({ cases: [] })
            .expect(400);
    });
    describe('download', () => {
        it('should return 200 OK', async () => {
            const c = new Case(minimalCase);
            await c.save();
            const c2 = new Case(fullCase);
            await c2.save();
            const res = await request(app)
                .post('/api/cases/download')
                .send({})
                .expect('Content-Type', 'text/csv')
                .expect(200);
            expect(res.text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(res.text).toContain(c._id);
            expect(res.text).toContain(c.caseReference.verificationStatus);
            expect(res.text).toContain(c.caseReference.sourceId);
            expect(res.text).toContain(c2._id);
            expect(res.text).toContain(c2.caseReference.verificationStatus);
            expect(res.text).toContain(c2.caseReference.sourceId);
        });
        it('rejects invalid searches', (done) => {
            request(app)
                .post('/api/cases/download')
                .send({
                    query: 'country:',
                })
                .expect(422, done);
        });
        it('rejects request bodies with query and caseIds', async (done) => {
            const c = new Case(minimalCase);
            await c.save();

            request(app)
                .post('/api/cases/download')
                .send({
                    query: 'country:India',
                    caseIds: [c._id],
                })
                .expect(400, done);
        });
        it('should filter results with caseIds', async () => {
            const matchingCase = new Case(minimalCase);
            await matchingCase.save();

            const matchingCase2 = new Case(minimalCase);
            await matchingCase2.save();

            const unmatchedCase = new Case(minimalCase);
            await unmatchedCase.save();

            const res = await request(app)
                .post('/api/cases/download')
                .send({
                    caseIds: [matchingCase._id, matchingCase2._id],
                })
                .expect('Content-Type', 'text/csv')
                .expect(200);
            expect(res.text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(res.text).toContain(matchingCase._id);
            expect(res.text).toContain(matchingCase2._id);
            expect(res.text).not.toContain(unmatchedCase._id);
        });
        it('should filter results with text query', async () => {
            // Simulate index creation used in unit tests, in production they are
            // setup by the setup-db script and such indexes are not present by
            // default in the in memory mongo spawned by unit tests.
            await mongoose.connection.collection('cases').createIndex({
                notes: 'text',
            });

            const matchingCase = new Case(minimalCase);
            const matchingNotes = 'matching';
            matchingCase.notes = matchingNotes;
            await matchingCase.save();

            const unmatchedCase = new Case(minimalCase);
            const unmatchedNotes = 'unmatched';
            unmatchedCase.notes = unmatchedNotes;
            await unmatchedCase.save();

            const res = await request(app)
                .post('/api/cases/download')
                .send({
                    query: matchingNotes,
                })
                .expect('Content-Type', 'text/csv')
                .expect(200);
            expect(res.text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(res.text).toContain(matchingNotes);
            expect(res.text).toContain(matchingCase._id);
            expect(res.text).toContain(matchingNotes);
            expect(res.text).not.toContain(unmatchedCase._id);
            expect(res.text).not.toContain(unmatchedNotes);
        });
        it('should filter results with keyword query', async () => {
            const matchedCase = new Case(minimalCase);
            matchedCase.location.country = 'Germany';
            matchedCase.set('demographics.occupation', 'engineer');
            await matchedCase.save();

            const unmatchedCase = new Case(minimalCase);
            await unmatchedCase.save();

            const res = await request(app)
                .post('/api/cases/download')
                .send({
                    query: 'country:Germany',
                })
                .expect('Content-Type', 'text/csv')
                .expect(200);
            expect(res.text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(res.text).toContain('Germany');
            expect(res.text).toContain(matchedCase._id);
            expect(res.text).not.toContain(unmatchedCase._id);
        });
        it('should exclude results with excluded sources', async () => {
            const excludedSource = {
                name: 'Excluded',
                origin: {
                    url: 'https://notshared.example.com/',
                    license: 'Proprietary',
                },
                format: 'csv',
                excludeFromLineList: true,
            };
            await mongoose.connection
                .collection('sources')
                .insertOne(excludedSource);
            const source = await mongoose.connection
                .collection('sources')
                .findOne({});
            const excludedCase = new Case({
                ...minimalCase,
                caseReference: {
                    ...minimalCase.caseReference,
                    sourceId: source._id.valueOf(),
                    sourceUrl: excludedSource.origin.url,
                },
            });
            await excludedCase.save();
            const res = await request(app)
                .post('/api/cases/download')
                .send({})
                .expect('Content-Type', 'text/csv')
                .expect(200);
            expect(res.text).not.toContain('notshared.example.com');
        });
    });

    describe('batch status change', () => {
        it('should not accept invalid statuses', async () => {
            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [''],
                    status: 'xxx',
                    ...curatorMetadata,
                })
                .expect(400);
        });

        it('should require note when excluding cases', async () => {
            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [''],
                    status: 'EXCLUDED',
                    ...curatorMetadata,
                })
                .expect(422);
        });

        it('should return 200 OK when excluding cases with note', async () => {
            const existingCase = new Case(fullCase);
            await existingCase.save();

            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [existingCase._id],
                    status: 'EXCLUDED',
                    note: 'Duplicate',
                    ...curatorMetadata,
                })
                .expect(200);
        });

        it('should save note when excluding cases with note', async () => {
            const firstExistingCase = new Case(fullCase);
            await firstExistingCase.save();
            const secondExistingCase = new Case(fullCase);
            await secondExistingCase.save();

            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [firstExistingCase._id, secondExistingCase._id],
                    status: 'EXCLUDED',
                    note: 'Duplicate',
                    ...curatorMetadata,
                })
                .expect(200);

            const firstCaseInDb = await Case.findById(firstExistingCase._id);
            const secondCaseInDb = await Case.findById(secondExistingCase._id);
            expect(firstCaseInDb?.caseReference.verificationStatus).toEqual(
                'EXCLUDED',
            );
            expect(secondCaseInDb?.caseReference.verificationStatus).toEqual(
                'EXCLUDED',
            );
            expect(firstCaseInDb?.exclusionData.note).toEqual('Duplicate');
            expect(secondCaseInDb?.exclusionData.note).toEqual('Duplicate');
        });

        it('should save current date when excluding cases', async () => {
            const firstExistingCase = new Case(fullCase);
            await firstExistingCase.save();
            const secondExistingCase = new Case(fullCase);
            await secondExistingCase.save();

            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [firstExistingCase._id, secondExistingCase._id],
                    status: 'EXCLUDED',
                    note: 'Duplicate',
                    ...curatorMetadata,
                })
                .expect(200);

            const firstCaseInDb = await Case.findById(firstExistingCase._id);
            const secondCaseInDb = await Case.findById(secondExistingCase._id);
            expect(firstCaseInDb?.exclusionData.date).toEqual(
                new Date('2020-12-12T12:12:37.000Z'),
            );
            expect(secondCaseInDb?.exclusionData.date).toEqual(
                new Date('2020-12-12T12:12:37.000Z'),
            );
        });

        it('should remove exclusion data when unexcluding cases', async () => {
            const firstExistingCase = new Case(fullCase);
            await firstExistingCase.save();
            const secondExistingCase = new Case(fullCase);
            await secondExistingCase.save();

            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [firstExistingCase._id, secondExistingCase._id],
                    status: 'EXCLUDED',
                    note: 'Duplicate',
                    ...curatorMetadata,
                })
                .expect(200);

            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    caseIds: [firstExistingCase._id, secondExistingCase._id],
                    status: 'UNVERIFIED',
                    ...curatorMetadata,
                })
                .expect(200);

            const firstCaseInDb = await Case.findById(firstExistingCase._id);
            const secondCaseInDb = await Case.findById(secondExistingCase._id);
            expect(firstCaseInDb?.caseReference.verificationStatus).toEqual(
                'UNVERIFIED',
            );
            expect(secondCaseInDb?.caseReference.verificationStatus).toEqual(
                'UNVERIFIED',
            );
            expect(firstCaseInDb?.exclusionData).not.toBeDefined();
            expect(secondCaseInDb?.exclusionData).not.toBeDefined();
        });

        it('should allow query instead of list of case IDs', async () => {
            const firstExistingCase = new Case(fullCase);
            await firstExistingCase.save();
            const secondExistingCase = new Case(fullCase);
            await secondExistingCase.save();

            await request(app)
                .post('/api/cases/batchStatusChange')
                .send({
                    query: 'country:France',
                    status: 'EXCLUDED',
                    note: 'Duplicate',
                    ...curatorMetadata,
                })
                .expect(200);

            const firstCaseInDb = await Case.findById(firstExistingCase._id);
            const secondCaseInDb = await Case.findById(secondExistingCase._id);
            expect(firstCaseInDb?.caseReference.verificationStatus).toEqual(
                'EXCLUDED',
            );
            expect(secondCaseInDb?.caseReference.verificationStatus).toEqual(
                'EXCLUDED',
            );
        });
    });

    describe('excludedCaseIds', () => {
        it('should require sourceId and return 400 if not present', async () => {
            const res = await request(app)
                .get('/api/excludedCaseIds')
                .expect(400);
        });

        it('should return empty array when no cases match', async () => {
            const existingCase = new Case(fullCase);
            await existingCase.save();

            const caseSourceId = existingCase.caseReference.sourceId;

            const res = await request(app)
                .get(`/api/excludedCaseIds?sourceId=${caseSourceId}`)
                .expect(200);

            expect(res.text).toContain('[]');
        });

        it('should return array with correct results when some cases match', async () => {
            const case1 = new Case(fullCase);
            case1.caseReference.verificationStatus = 'EXCLUDED';
            case1.caseReference.sourceEntryId = 'entry1';
            await case1.save();

            const case2 = new Case(fullCase);
            case2.caseReference.verificationStatus = 'EXCLUDED';
            case2.caseReference.sourceEntryId = 'entry2';
            await case2.save();

            const case3 = new Case(fullCase);
            case3.caseReference.verificationStatus = 'EXCLUDED';
            case3.caseReference.sourceId = 'invalid';
            await case3.save();

            const caseSourceId = case1.caseReference.sourceId;

            const res = await request(app)
                .get(`/api/excludedCaseIds?sourceId=${caseSourceId}`)
                .expect(200);

            expect(res.text).toContain(case1.caseReference.sourceEntryId);
            expect(res.text).toContain(case2.caseReference.sourceEntryId);
            expect(res.text).not.toContain(case3.caseReference.sourceEntryId);
        });

        it('should allow filtering of results by start date', async () => {
            const case1 = new Case(fullCase);
            case1.caseReference.verificationStatus = 'EXCLUDED';
            case1.caseReference.sourceEntryId = 'entry1';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            case1.events[1].dateRange.start = new Date('01-01-2020');
            await case1.save();

            const case2 = new Case(fullCase);
            case2.caseReference.verificationStatus = 'EXCLUDED';
            case2.caseReference.sourceEntryId = 'entry2';
            await case2.save();

            const caseSourceId = case1.caseReference.sourceId;

            const res = await request(app)
                .get(
                    `/api/excludedCaseIds?sourceId=${caseSourceId}&dateFrom=2020-01-11`,
                )
                .expect(200);

            expect(res.text).not.toContain(case1.caseReference.sourceEntryId);
            expect(res.text).toContain(case2.caseReference.sourceEntryId);
        });

        it('should allow filtering of results by end date', async () => {
            const case1 = new Case(fullCase);
            case1.caseReference.verificationStatus = 'EXCLUDED';
            case1.caseReference.sourceEntryId = 'entry1';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            case1.events[1].dateRange.start = new Date('01-01-2020');
            await case1.save();

            const case2 = new Case(fullCase);
            case2.caseReference.verificationStatus = 'EXCLUDED';
            case2.caseReference.sourceEntryId = 'entry2';
            await case2.save();

            const caseSourceId = case1.caseReference.sourceId;

            const res = await request(app)
                .get(
                    `/api/excludedCaseIds?sourceId=${caseSourceId}&dateTo=2020-01-11`,
                )
                .expect(200);

            expect(res.text).toContain(case1.caseReference.sourceEntryId);
            expect(res.text).not.toContain(case2.caseReference.sourceEntryId);
        });

        it('should allow filtering of results by date range', async () => {
            const case1 = new Case(fullCase);
            case1.caseReference.verificationStatus = 'EXCLUDED';
            case1.caseReference.sourceEntryId = 'entry1';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            case1.events[1].dateRange.start = new Date('01-01-2020');
            await case1.save();

            const case2 = new Case(fullCase);
            case2.caseReference.verificationStatus = 'EXCLUDED';
            case2.caseReference.sourceEntryId = 'entry2';
            await case2.save();

            const case3 = new Case(fullCase);
            case3.caseReference.verificationStatus = 'EXCLUDED';
            case3.caseReference.sourceEntryId = 'entry3';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            case3.events[1].dateRange.start = new Date('01-30-2020');
            await case3.save();

            const caseSourceId = case1.caseReference.sourceId;

            const res = await request(app)
                .get(
                    `/api/excludedCaseIds?sourceId=${caseSourceId}&dateFrom=2020-01-03&dateTo=2020-01-15`,
                )
                .expect(200);

            expect(res.text).not.toContain(case1.caseReference.sourceEntryId);
            expect(res.text).toContain(case2.caseReference.sourceEntryId);
            expect(res.text).not.toContain(case3.caseReference.sourceEntryId);
        });
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
    it('update present item with unknown travel locations should be 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();

        const travelHistory = {
            traveledPrior30Days: true,
            travel: [
                {
                    methods: ['Flight'],
                    dateRange: {
                        start: '2020-11-24T00:00:00.000Z',
                        end: '2020-11-24T00:00:00.000Z',
                    },
                },
            ],
        };
        const res = await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, travelHistory })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.travelHistory).toEqual(travelHistory);
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
    it('update many items should return 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();
        const c2 = new Case(minimalCase);
        await c2.save();
        await new Case(minimalCase).save();

        const newNotes = 'abc';
        const newNotes2 = 'cba';
        const res = await request(app)
            .post('/api/cases/batchUpdate')
            .send({
                ...curatorMetadata,
                cases: [
                    { _id: c._id, notes: newNotes },
                    { _id: c2._id, notes: newNotes2 },
                ],
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.numModified).toEqual(2);
        const cases = await Case.find();
        expect(cases[0].notes).toEqual(newNotes);
        expect(cases[1].notes).toEqual(newNotes2);
    });
    it('update many items without locations in travel history should return 200 OK', async () => {
        const c = new Case(minimalCase);
        await c.save();
        const c2 = new Case(minimalCase);
        await c2.save();
        await new Case(minimalCase).save();

        const newNotes = 'abc';
        const date = '2020-11-24T00:00:00.000Z';
        const travelHistory = {
            traveledPrior30Days: true,
            travel: [
                {
                    methods: ['Flight'],
                    dateRange: { start: date, end: date },
                },
            ],
        };

        const res = await request(app)
            .post('/api/cases/batchUpdate')
            .send({
                ...curatorMetadata,
                cases: [
                    { _id: c._id, notes: newNotes },
                    { _id: c2._id, travelHistory },
                ],
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.numModified).toEqual(2);
        const cases = await Case.find();
        expect(cases[0].notes).toEqual(newNotes);
        expect(cases[1].travelHistory.travel[0].methods[0]).toEqual('Flight');
    });
    it('update many items without _id should return 422', async () => {
        const c = new Case(minimalCase);
        await c.save();
        const c2 = new Case(minimalCase);
        await c2.save();
        await new Case(minimalCase).save();

        const newNotes = 'abc';
        const newNotes2 = 'cba';
        await request(app)
            .post('/api/cases/batchUpdate')
            .send({
                ...curatorMetadata,
                cases: [{ _id: c._id, notes: newNotes }, { notes: newNotes2 }],
            })
            .expect('Content-Type', /json/)
            .expect(422);
    });
    it('update many items from query should return 200 OK', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the setup-db script and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        await mongoose.connection.collection('cases').createIndex({
            notes: 'text',
        });

        const c = new Case(minimalCase);
        c.notes = 'test case';
        await c.save();
        const c2 = new Case(minimalCase);
        c2.notes = 'test case';
        await c2.save();
        const c3 = new Case(minimalCase);
        const unchangedNotes = 'unchanged notes';
        c3.notes = unchangedNotes;
        await c3.save();

        const newNotes = 'abc';
        const res = await request(app)
            .post('/api/cases/batchUpdateQuery')
            .send({
                ...curatorMetadata,
                query: 'test case',
                case: { notes: newNotes },
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.numModified).toEqual(2);
        const cases = await Case.find();
        expect(cases[0].notes).toEqual(newNotes);
        expect(cases[1].notes).toEqual(newNotes);
        expect(cases[2].notes).toEqual(unchangedNotes);
    });
    it('update many items with query without case should return 400', async () => {
        await request(app)
            .post('/api/cases/batchUpdateQuery')
            .send({
                ...curatorMetadata,
                query: 'test case',
            })
            .expect(400);
    });
    it('batchUpdateQuery without query should return 400', async () => {
        await request(app)
            .post('/api/cases/batchUpdateQuery')
            .send({
                ...curatorMetadata,
                case: { notes: 'new notes' },
            })
            .expect(400);
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
        return request(app)
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
        await request(app)
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

        await request(app).delete(`/api/cases/${c._id}`).expect(204);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
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

        expect(await CaseRevision.collection.countDocuments()).toEqual(2);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
        expect((await CaseRevision.find())[1].case.toObject()).toEqual(
            c2.toObject(),
        );
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
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);

        // Deletes matched queries
        await request(app)
            .delete('/api/cases')
            .send({ query: 'at work gender:Female' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(2);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );

        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Female' })
            .expect(204);
        expect(await Case.collection.countDocuments()).toEqual(1);

        expect(await CaseRevision.collection.countDocuments()).toEqual(2);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
        expect((await CaseRevision.find())[1].case.toObject()).toEqual(
            c2.toObject(),
        );
    });
    it('delete multiple cases cannot go over threshold', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the setup-db script and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        await mongoose.connection.collection('cases').createIndex({
            notes: 'text',
        });

        await Promise.all([
            new Case(minimalCase).set('notes', 'foo').save(),
            new Case(minimalCase).set('notes', 'foo').save(),
            new Case(minimalCase).set('notes', 'foo').save(),
        ]);
        expect(await Case.collection.countDocuments()).toEqual(3);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'foo', maxCasesThreshold: 2 })
            .expect(422, /more than the maximum allowed/);
        expect(await Case.collection.countDocuments()).toEqual(3);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
});
