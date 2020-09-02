import mongoose from 'mongoose';

export const uploadSummarySchema = new mongoose.Schema(
    {
        numCreated: Number,
        numUpdated: Number,
        error: String,
    },
    {
        _id: false,
    },
);

export type UploadSummaryDocument = mongoose.Document & {
    numCreated: number;
    numUpdated: number;
    error: string;
};
