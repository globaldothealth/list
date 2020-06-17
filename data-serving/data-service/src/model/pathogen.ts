import { SourceDocument, sourceSchema } from './source';

import mongoose from 'mongoose';

export const pathogenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    id: {
        type: Number,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value',
        },
        required: true,
    },
});

export type PathogenDocument = mongoose.Document & {
    name: string;
    id: string;
};
