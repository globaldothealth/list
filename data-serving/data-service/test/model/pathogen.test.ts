import { PathogenDocument, pathogenSchema } from '../../src/model/pathogen';

import { Error } from 'mongoose';
import fullModel from './data/pathogen.full.json';
import minimalModel from './data/pathogen.minimal.json';
import mongoose from 'mongoose';

const Pathogen = mongoose.model<PathogenDocument>('Pathogen', pathogenSchema);

describe('validate', () => {
    it('a pathogen without a name is invalid', async () => {
        const missingName = { ...minimalModel };
        delete missingName.name;

        return new Pathogen(missingName).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a pathogen without an id is invalid', async () => {
        const missingId = { ...minimalModel };
        delete missingId.id;

        return new Pathogen(missingId).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a non-integer pathogen id is invalid', async () => {
        return new Pathogen({ ...minimalModel, id: 1.1 }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal pathogen is valid', async () => {
        return new Pathogen(minimalModel).validate();
    });

    it('a fully specified pathogen is valid', async () => {
        return new Pathogen(fullModel).validate();
    });
});
