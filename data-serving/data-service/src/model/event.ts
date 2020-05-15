import { DateRangeDocument, dateRangeSchema } from './date-range';

import mongoose from 'mongoose';

export const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a name for the event',
    },
    dateRange: dateRangeSchema,
});

export type EventDocument = mongoose.Document & {
    name: string;
    dateRange: DateRangeDocument;
};
