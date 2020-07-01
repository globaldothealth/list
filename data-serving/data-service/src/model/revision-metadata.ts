import { dateFieldInfo } from './date';
import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

const editMetadataSchema = new mongoose.Schema({
    curator: {
        type: String,
        required: true,
    },
    date: {
        ...dateFieldInfo,
        required: true,
    },
    notes: String,
});

export const revisionMetadataSchema = new mongoose.Schema({
    revisionNumber: {
        ...positiveIntFieldInfo,
        required: true,
    },
    creationMetadata: {
        type: editMetadataSchema,
        required: true,
    },
    updateMetadata: {
        type: editMetadataSchema,
        required: function (this: RevisionMetadataDocument): boolean {
            return this?.revisionNumber > 0;
        },
    },
});

type EditMetadataDocument = mongoose.Document & {
    curator: string;
    date: Date;
    notes: string;
};

export type RevisionMetadataDocument = mongoose.Document & {
    revisionNumber: number;
    creationMetadata: EditMetadataDocument;
    updateMetadata?: EditMetadataDocument;
};
