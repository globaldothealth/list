import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

/*
 * This is a minimal case schema to support some source-related behaviour.
 * The full schema for cases is in the data service.
 */

const caseReferenceSchema = new mongoose.Schema(
    {
        sourceId: {
            type: String,
            required: true,
        },
    },
    { _id: false}
);

export const caseSchema = new mongoose.Schema(
    {
        caseReference: {
            type: caseReferenceSchema,
            required: true,
        },
    }
);

type CaseReferenceDocument = mongoose.Document & {
    /** Foreign key to the sources collection. */
    sourceId: string;
};

export type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    caseReference: CaseReferenceDocument;
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
export const RestrictedCase = mongoose.model<CaseDocument>(
    'RestrictedCase',
    caseSchema,
);
