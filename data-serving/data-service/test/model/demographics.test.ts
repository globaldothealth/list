import {
    DemographicsDocument,
    demographicsSchema,
} from '../../src/model/demographics';

import { Error } from 'mongoose';
import mongoose from 'mongoose';

const Demographics = mongoose.model<DemographicsDocument>(
    'Demographics',
    demographicsSchema,
);

describe('validate', () => {
    it('a start age under -1 is invalid', async () => {
        return new Demographics({ ageRange: { start: -1.1 } }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
    it('a start age over 300 is invalid', async () => {
        return new Demographics({ ageRange: { start: 301 } }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
    it('an end age under -1 is invalid', async () => {
        return new Demographics({ ageRange: { end: -2 } }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
    it('an end age over 300 is invalid', async () => {
        return new Demographics({ ageRange: { end: 300.1 } }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an unknown species name is invalid', async () => {
        return new Demographics({ species: 'Felis catus' }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an unknown sex is invalid', async () => {
        return new Demographics({ sex: 'Also felis catus' }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an empty demographics document is valid', async () => {
        return new Demographics({}).validate();
    });

    it('a fully specified demographics document is valid', async () => {
        return new Demographics({
            ageRange: {
                start: 20,
                end: 29,
            },
            sex: 'Female',
            species: 'Homo sapien',
        }).validate();
    });
});
