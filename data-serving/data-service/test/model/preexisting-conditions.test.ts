import {
    PreexistingConditionsDocument,
    preexistingConditionsSchema,
} from '../../src/model/preexisting-conditions';

import fullModel from './data/preexisting-conditions.full.json';
import minimalModel from './data/preexisting-conditions.minimal.json';
import mongoose from 'mongoose';

const PreexistingConditions = mongoose.model<PreexistingConditionsDocument>(
    'PreexistingConditions',
    preexistingConditionsSchema,
);

describe('validate', () => {
    it('a minimal preexisting conditions document is valid', async () => {
        return new PreexistingConditions(minimalModel).validate();
    });

    it('a fully specified preexisting conditions document is valid', async () => {
        return new PreexistingConditions(fullModel).validate();
    });
});
