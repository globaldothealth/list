import mongoose from 'mongoose';

export const uploadSummarySchema = new mongoose.Schema(
    {
        numCreated: Number,
        numUpdated: Number,
        numError: Number,
        error: String,
    },
    {
        _id: false,
    },
);

export type IUploadSummary = {
    numCreated?: number;
    numUpdated?: number;
    numError?: number;
    error?: string;
};
