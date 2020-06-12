import { dateFieldInfo } from './date';
import mongoose from 'mongoose';

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
        type: Number,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value',
        },
        required: true,
    },
    creationMetadata: {
        type: editMetadataSchema,
        required: true,
    },
    updateMetadata: {
        type: editMetadataSchema,
        required: function (this: RevisionMetadataDocument): boolean {
                return this.revisionNumber > 0;
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
    updateMetadata: EditMetadataDocument;
};
