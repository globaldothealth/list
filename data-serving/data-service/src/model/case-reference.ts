import mongoose from 'mongoose';

export const caseReferenceSchema = new mongoose.Schema({
    sourceId: {
        type: String,
        required: true,
    },
    sourceEntryId: String,
});

export type CaseReferenceDocument = mongoose.Document & {
    sourceId: string;
    sourceEntryId: string;
};
