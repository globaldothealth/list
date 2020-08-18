import {
    UploadSummaryDocument,
    uploadSummarySchema,
} from '../../src/model/upload-summary';

import fullModel from './data/upload-summary.full.json';
import minimalModel from './data/upload-summary.minimal.json';
import mongoose from 'mongoose';

const UploadSummary = mongoose.model<UploadSummaryDocument>(
    'UploadSummary',
    uploadSummarySchema,
);

describe('validate', () => {
    it('a minimal uploadSummary document is valid', async () => {
        return new UploadSummary(minimalModel).validate();
    });

    it('a fully specified uploadSummary document is valid', async () => {
        return new UploadSummary(fullModel).validate();
    });
});
