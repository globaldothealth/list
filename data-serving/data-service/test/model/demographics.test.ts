import {
    DemographicsDocument,
    demographicsSchema,
} from '../../src/model/demographics';

import { Error } from 'mongoose';
import fullModel from './data/demographics.full.json';
import minimalModel from './data/demographics.minimal.json';
import mongoose from 'mongoose';

const Demographics = mongoose.model<DemographicsDocument>(
    'Demographics',
    demographicsSchema,
);

describe('validate', () => {
    it('a start age under -1 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { start: -1.1 } },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a start age over 300 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { start: 301 } },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an end age under -1 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { end: -2 } },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an end age over 300 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { end: 300.1 } },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an unknown sex is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ sex: 'Some free text' },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal demographics document is valid', async () => {
        return new Demographics(minimalModel).validate();
    });

    it('a fully specified demographics document is valid', async () => {
        return new Demographics(fullModel).validate();
    });
});
