import { SourceDocument, sourceSchema } from './source';

import mongoose from 'mongoose';

export const pathogenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
    },
});

export type PathogenDocument = mongoose.Document & {
    name: string;
    id: string;
};
