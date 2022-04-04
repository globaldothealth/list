import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import db from './database';

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

export type ICase = {
    _id: ObjectId;
    caseReference: {
        sourceId: string,
    },
};

export type CaseDocument = mongoose.Document & ICase;

export const cases = () => db().collection('cases');
export const restrictedCases = () => db().collection('restrictedcases');

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
export const RestrictedCase = mongoose.model<CaseDocument>(
    'RestrictedCase',
    caseSchema,
);
