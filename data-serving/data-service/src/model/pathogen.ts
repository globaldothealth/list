import { SourceDocument, sourceSchema } from './source';

import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const pathogenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        text: true,
    },
    id: {
        ...positiveIntFieldInfo,
        required: true,
    },
});

export type PathogenDocument = mongoose.Document & {
    name: string;
    id: string;
};
