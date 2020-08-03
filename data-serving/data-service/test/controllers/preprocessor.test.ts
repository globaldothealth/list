import { Request, Response } from 'express';
import {
    createCaseRevision,
    setRevisionMetadata,
} from '../../src/controllers/preprocessor';

import { Case } from '../../src/model/case';
import { CaseRevision } from '../../src/model/case-revision';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import minimalCase from './../model/data/case.minimal.json';
import supertest from 'supertest';

let mongoServer: MongoMemoryServer;
let dateNowSpy: any;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
    dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => Date.parse('2020-03-03'));
});

beforeEach(async () => {
    supertest.agent(app);
    await Case.deleteMany({});
    return CaseRevision.deleteMany({});
});

afterAll(() => {
    dateNowSpy.mockRestore();
    return mongoServer.stop();
});

describe('create', () => {
    it('sets create metadata', async () => {
        const requestBody = {
            ...minimalCase,
            curator: { email: 'creator@gmail.com' },
        };
        const nextFn = jest.fn();
        await setRevisionMetadata(
            { body: requestBody, method: 'POST' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.now(),
                },
            },
        });
    });
    it('does not create a case revision', async () => {
        const requestBody = {
            ...minimalCase,
            curator: { email: 'creator@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            { body: requestBody, method: 'POST' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
});

describe('update', () => {
    it('sets update metadata and preserves create metadata', async () => {
        const c = new Case({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...minimalCase,
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await setRevisionMetadata(
            {
                body: requestBody,
                method: 'PUT',
                params: { id: c._id },
            } as Request<any>,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 1,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
                updateMetadata: {
                    curator: 'updater@gmail.com',
                    date: Date.now(),
                },
            },
        });
    });
    it('sets update metadata and replaces existing update metadata', async () => {
        const c = new Case({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 1,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
                updateMetadata: {
                    curator: 'updater1@gmail.com',
                    date: Date.parse('2020-02-02'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...minimalCase,
            curator: { email: 'updater2@gmail.com' },
        };
        const nextFn = jest.fn();
        await setRevisionMetadata(
            {
                body: requestBody,
                method: 'PUT',
                params: { id: c._id },
            } as Request<any>,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 2,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
                updateMetadata: {
                    curator: 'updater2@gmail.com',
                    date: Date.now(),
                },
            },
        });
    });
    it('creates a case revision', async () => {
        const c = new Case({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...minimalCase,
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            {
                body: requestBody,
                method: 'PUT',
                params: { id: c._id },
            } as Request<any>,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
    });
});

describe('upsert', () => {
    it('with no existing case sets create metadata', async () => {
        const upsertCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id',
            },
        };
        const requestBody = {
            ...upsertCase,
            curator: { email: 'creator@gmail.com' },
        };
        const nextFn = jest.fn();
        await setRevisionMetadata(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            ...upsertCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.now(),
                },
            },
        });
    });
    it('with existing case sets update metadata', async () => {
        const upsertCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id',
            },
        };
        const c = new Case({
            ...upsertCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...upsertCase,
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await setRevisionMetadata(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            ...upsertCase,
            revisionMetadata: {
                revisionNumber: 1,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
                updateMetadata: {
                    curator: 'updater@gmail.com',
                    date: Date.now(),
                },
            },
        });
    });
    it('with no existing case does not create a case revision', async () => {
        const upsertCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id',
            },
        };
        const requestBody = {
            ...upsertCase,
            curator: { email: 'creator@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('with existing case creates a case revision', async () => {
        const upsertCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id',
            },
        };
        const c = new Case({
            ...upsertCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...upsertCase,
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case.toObject()).toEqual(
            c.toObject(),
        );
    });
});
describe('batch upsert', () => {
    it('sets create metadata', async () => {
        const existingCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_exists',
            },
        };
        const c = new Case({
            ...existingCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const newCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_new',
            },
        };

        const requestBody = {
            cases: [existingCase, newCase],
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await setRevisionMetadata(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            cases: [
                {
                    ...existingCase,
                    revisionMetadata: {
                        revisionNumber: 1,
                        creationMetadata: {
                            curator: 'creator@gmail.com',
                            date: Date.parse('2020-01-01'),
                        },
                        updateMetadata: {
                            curator: 'updater@gmail.com',
                            date: Date.now(),
                        },
                    },
                },
                {
                    ...newCase,
                    revisionMetadata: {
                        revisionNumber: 0,
                        creationMetadata: {
                            curator: 'updater@gmail.com',
                            date: Date.now(),
                        },
                    },
                },
            ],
        });
    });
});
