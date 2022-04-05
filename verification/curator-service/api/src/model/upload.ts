import { IUploadSummary, uploadSummarySchema } from './upload-summary';

import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export const uploadSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
    },
    summary: {
        type: uploadSummarySchema,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

export type IUpload = {
    _id: ObjectId,
    status: string,
    summary: IUploadSummary,
    created: Date,
};
