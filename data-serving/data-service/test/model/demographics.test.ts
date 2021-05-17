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
    it('a start age under 0 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { start: -0.1 } },
        }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a start age over 120 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { start: 121 } },
        }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an end age under 0 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { end: -2 } },
        }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a start age without end is valid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { start: 85 } },
        }).validate();
    });

    it('an end age over 120 is invalid', async () => {
        return new Demographics({
            ...fullModel,
            ...{ ageRange: { end: 120.1 } },
        }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal demographics document is valid', async () => {
        return new Demographics(minimalModel).validate();
    });

    it('a fully specified demographics document is valid', async () => {
        return new Demographics(fullModel).validate();
    });
});
