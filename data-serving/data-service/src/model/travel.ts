import { DateRangeDocument, dateRangeSchema } from './date-range';
import { FuzzyLocationDocument, fuzzyLocationSchema } from './location';

import mongoose from 'mongoose';

export const travelSchema = new mongoose.Schema(
    {
        dateRange: dateRangeSchema,
        location: fuzzyLocationSchema,
        methods: [String],
        purpose: String,
    },
    { _id: false },
);

export type TravelDocument = mongoose.Document & {
    dateRange: DateRangeDocument;
    location: FuzzyLocationDocument;
    methods: [string];
    purpose: string;
};
