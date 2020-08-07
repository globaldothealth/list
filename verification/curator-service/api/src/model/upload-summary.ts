import mongoose from 'mongoose';

export const uploadSummarySchema = new mongoose.Schema(
    {
        numCreated: Number,
        numUpdated: Number,
        error: String,
    },
    {
        id: false,
    },
);

export type UploadSummaryDocument = mongoose.Document & {
    numCreated: number;
    numUpdated: number;
    error: string;
};
