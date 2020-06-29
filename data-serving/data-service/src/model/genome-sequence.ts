import { dateFieldInfo } from './date';
import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const genomeSequenceSchema = new mongoose.Schema({
    sampleCollectionDate: dateFieldInfo,
    repositoryUrl: {
        type: String,
    },
    sequenceId: {
        type: String,
    },
    sequenceName: {
        type: String,
    },
    sequenceLength: positiveIntFieldInfo,
    notes: {
        type: String,
    },
});

export type GenomeSequenceDocument = mongoose.Document & {
    sampleCollectionDate: Date;
    repositoryUrl: string;
    sequenceId: string;
    sequenceName: string;
    sequenceLength: number;
    notes: string;
};
