import { SourceDocument, sourceSchema } from './source';

import mongoose from 'mongoose';

export const pathogenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a pathogen name',
    },
    sequenceSources: [sourceSchema],
    additionalInformation: String,
});

export type PathogenDocument = mongoose.Document & {
    name: string;
    sequenceSources: [SourceDocument];
    additionalInformation: string;
};
