import { dateFieldInfo } from './date';
import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const genomeSequenceSchema = new mongoose.Schema(
    {
        sampleCollectionDate: dateFieldInfo,
        repositoryUrl: String,
        sequenceId: String,
        sequenceName: String,
        sequenceLength: positiveIntFieldInfo,
    },
    { _id: false },
);

export type GenomeSequenceDocument = mongoose.Document & {
    sampleCollectionDate: Date;
    repositoryUrl: string;
    sequenceId: string;
    sequenceName: string;
    sequenceLength: number;
};
