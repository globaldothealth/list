import {
    GenomeSequenceDocument,
    genomeSequenceSchema,
} from '../../src/model/genome-sequence';

import { Error } from 'mongoose';
import fullModel from './data/genome-sequence.full.json';
import minimalModel from './data/genome-sequence.minimal.json';
import mongoose from 'mongoose';

const GenomeSequence = mongoose.model<GenomeSequenceDocument>(
    'GenomeSequence',
    genomeSequenceSchema,
);

describe('validate', () => {
    it('genome sequence with non-conforming date is invalid', async () => {
        return new GenomeSequence({
            ...minimalModel,
            ...{ sampleCollectionDate: Date.parse('2019-10-31') },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('genome sequence with non-integer length is invalid', async () => {
        return new GenomeSequence({
            ...minimalModel,
            ...{ sequenceLength: 2.2 },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('minimal genome sequence model is valid', async () => {
        return new GenomeSequence(minimalModel).validate();
    });

    it('fully specified genome sequence model is valid', async () => {
        return new GenomeSequence(fullModel).validate();
    });
});
