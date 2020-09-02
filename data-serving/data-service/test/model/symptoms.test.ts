import { SymptomsDocument, symptomsSchema } from '../../src/model/symptoms';

import { Error } from 'mongoose';
import fullModel from './data/symptoms.full.json';
import minimalModel from './data/symptoms.minimal.json';
import mongoose from 'mongoose';

const Symptoms = mongoose.model<SymptomsDocument>('Symptoms', symptomsSchema);

describe('validate', () => {
    it('a minimal symptoms document is valid', async () => {
        return new Symptoms(minimalModel).validate();
    });

    it('a fully specified symptoms document is valid', async () => {
        return new Symptoms(fullModel).validate();
    });
});
