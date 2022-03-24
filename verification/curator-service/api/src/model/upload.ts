import { UploadSummaryDocument, uploadSummarySchema } from './upload-summary';

import mongoose from 'mongoose';

export interface IUpload {
    _id: mongoose.Types.ObjectId;
    status: string;
    summary: UploadSummaryDocument;
    created: Date;
};

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

export type UploadDocument = mongoose.Document & IUpload;

export const Upload = mongoose.model<UploadDocument>('Upload', uploadSchema);
