import { dateSchema } from './date';
import mongoose from 'mongoose';

export const revisionMetadataSchema = new mongoose.Schema({
    id: {
        type: Number,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value',
        },
        required: 'Enter a revision id',
    },
    moderator: {
        type: String,
        required: 'Enter a revision moderator id',
    },
    date: {
        ...dateSchema,
        required: 'Enter a revision date',
    },
    notes: String,
});

export type RevisionMetadataDocument = mongoose.Document & {
    id: number;
    moderator: string;
    date: Date;
    notes: string;
};

export const RevisionMetadata = mongoose.model<RevisionMetadataDocument>(
    'RevisionMetadata',
    revisionMetadataSchema,
);
