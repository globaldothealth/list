import { Range } from './range';
import mongoose from 'mongoose';

export const ageBucketSchema = new mongoose.Schema({
    start: {
        type: Number,
        min: 0,
        max: 116,
    },
    end: {
        type: Number,
        min: 0,
        max: 120,
    },
});

export type AgeBucketDocument = mongoose.Document & Range<number>;

export const AgeBucket = mongoose.model<AgeBucketDocument>(
    'AgeBuckets',
    ageBucketSchema,
);
