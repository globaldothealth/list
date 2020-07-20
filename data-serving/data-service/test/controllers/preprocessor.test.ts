import { NextFunction, Request, Response } from 'express';

import { RevisionMetadata } from '../../src/model/revision-metadata';
import { assert } from 'console';
import minimalCase from './../model/data/case.minimal.json';
import { setRevisionMetadata } from '../../src/controllers/preprocessor';

let dateNowSpy: any;

beforeAll(() => {
    dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => Date.parse('2020-07-20T15:26:07.490Z'));
});

afterAll(() => {
    dateNowSpy.mockRestore();
});

describe('create', () => {
    it('', async () => {
        const request = { ...minimalCase, curator: { email: 'abc@def.com' } };
        const expectedRequest = {
            ...minimalCase,
            ...{
                revisionMetadata: {
                    revisionNumber: 0,
                    creationMetadata: {
                        curator: 'abc@def.com',
                        date: Date.now(),
                    },
                },
            },
        };
        await setRevisionMetadata(
            { body: request } as Request,
            {} as Response,
            jest.fn,
        );

        expect(expectedRequest).toEqual(request);
    });
});

describe('update', () => {
    it('', async () => {
        // TODO: Add tests
    });
});

describe('upsert', () => {
    it('', async () => {
        // TODO: Add tests
    });
});
