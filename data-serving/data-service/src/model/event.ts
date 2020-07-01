import { DateRangeDocument, dateRangeSchema } from './date-range';

import mongoose from 'mongoose';

export const eventSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: 'Enter a name for the event',
        },
        value: String,
        dateRange: dateRangeSchema,
    },
    { _id: false },
);

export type EventDocument = mongoose.Document & {
    name: string;
    value: string;
    dateRange: DateRangeDocument;
};
