import { Request, Response } from 'express';

import { Case } from '../../src/model/case';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import minimalCase from './../model/data/case.minimal.json';
import { setRevisionMetadata } from '../../src/controllers/preprocessor';
import supertest from 'supertest';

let mongoServer: MongoMemoryServer;
let dateNowSpy: any;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
    dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => Date.parse('2020-03-03'));
});

beforeEach(() => {
    supertest.agent(app);
    return Case.deleteMany({});
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
});
