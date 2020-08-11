import mongoose from 'mongoose';

export const dateFilterSchema = new mongoose.Schema({
    numDaysBeforeToday: Number,
    op: {
        type: String,
        enum: [
            // Only import cases from a given day.
            'EQ',
            // Import all cases strictly prior to a given day.
            'LT',
        ],
    },
});

export type DateFilterDocument = mongoose.Document & {
    numDaysBeforeToday: number;
    op: string;
};

export const DateFilter = mongoose.model<DateFilterDocument>(
    'DateFilter',
    dateFilterSchema,
);
