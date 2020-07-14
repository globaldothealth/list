import { DateRangeDocument, dateRangeSchema } from './date-range';
import { LocationDocument, locationSchema } from './location';

import mongoose from 'mongoose';

export const travelSchema = new mongoose.Schema(
    {
        dateRange: dateRangeSchema,
        location: locationSchema,
        methods: [String],
        purpose: String,
    },
    { _id: false },
);

export type TravelDocument = mongoose.Document & {
    dateRange: DateRangeDocument;
    location: LocationDocument;
    methods: [string];
    purpose: string;
};
