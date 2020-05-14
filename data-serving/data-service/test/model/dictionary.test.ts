import {
    DictionaryDocument,
    dictionarySchema,
} from '../../src/model/dictionary';

import fullModel from './data/dictionary.full.json';
import minimalModel from './data/dictionary.minimal.json';
import mongoose from 'mongoose';

const Dictionary = mongoose.model<DictionaryDocument>(
    'Dictionary',
    dictionarySchema,
);

describe('validate', () => {
    it('a minimal dictionary document is valid', async () => {
        return new Dictionary(minimalModel).validate();
    });

    it('a fully specified dictionary document is valid', async () => {
        return new Dictionary(fullModel).validate();
    });
});
