import mongoose from 'mongoose';

export const caseReferenceSchema = new mongoose.Schema({
    dataSourceId: {
        type: String,
        required: true,
    },
    dataEntryId: String,
});

export type CaseReferenceDocument = mongoose.Document & {
    dataSourceId: string;
    dataEntryId: string;
};
