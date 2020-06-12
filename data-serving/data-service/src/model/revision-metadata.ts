import { dateFieldInfo } from './date';
import mongoose from 'mongoose';

const editMetadataSchema = new mongoose.Schema({
    curator: {
        type: String,
        required: 'Enter a revision moderator id',
    },
    date: {
        ...dateFieldInfo,
        required: 'Enter a revision date',
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
        required: 'Enter a revision id',
    },
    creationMetadata: {
        type: editMetadataSchema,
        required: 'Enter creation metadata',
    },
    updateMetadata: {
        type: editMetadataSchema,
        required: [
            function (this: RevisionMetadataDocument): boolean {
                return this.revisionNumber > 0 && !this.updateMetadata;
            },
            'Enter update metadata',
        ],
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
