import {
    OutbreakSpecificsDocument,
    outbreakSpecificsSchema,
} from '../../src/model/outbreak-specifics';

import fullModel from './data/date-range.full.json';
import minimalModel from './data/date-range.minimal.json';
import mongoose from 'mongoose';

const OutbreakSpecifics = mongoose.model<OutbreakSpecificsDocument>(
    'OutbreakSpecifics',
    outbreakSpecificsSchema,
);

describe('validate', () => {
    it('a minimal outbreak specifics document is valid', async () => {
        return new OutbreakSpecifics(minimalModel).validate();
    });

    it('a fully specified outbreak specifics document is valid', async () => {
        return new OutbreakSpecifics(fullModel).validate();
    });
});
