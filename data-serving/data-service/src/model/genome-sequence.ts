import { dateFieldInfo } from './date';
import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const genomeSequenceSchema = new mongoose.Schema({
    sampleCollectionDate: dateFieldInfo,
    repositoryUrl: {
        type: String,
        text: true,
    },
    sequenceId: {
        type: String,
        text: true,
    },
    sequenceName: {
        type: String,
        text: true,
    },
    sequenceLength: positiveIntFieldInfo,
    notes: {
        type: String,
        text: true,
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
