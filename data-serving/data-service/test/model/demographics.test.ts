import {
    DemographicsDocument,
    demographicsSchema,
} from '../../src/model/demographics';

import fullModel from './data/demographics.full.json';
import minimalModel from './data/demographics.minimal.json';
import mongoose from 'mongoose';

const Demographics = mongoose.model<DemographicsDocument>(
    'Demographics',
    demographicsSchema,
);

describe('validate', () => {
    it('a minimal demographics document is valid', async () => {
        return new Demographics(minimalModel).validate();
    });

    it('a fully specified demographics document is valid', async () => {
        return new Demographics(fullModel).validate();
    });
});
