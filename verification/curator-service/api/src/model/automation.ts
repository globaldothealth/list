import { ParserDocument, parserSchema } from './parser';
import { RegexParsingDocument, regexParsingSchema } from './regex-parsing';
import { ScheduleDocument, scheduleSchema } from './schedule';

import mongoose from 'mongoose';

export const automationParsingValidator = {
    validator: (automation: AutomationDocument): boolean => {
        return !(automation.parser != null && automation.regexParsing != null);
    },
    message: 'At most one of parser or regexParsing may be supplied.',
};

const dateFilterSchema = new mongoose.Schema({
    numDaysBeforeToday: Number,
    op: {
        type: String,
        enum: [
            // Only import cases from a given day.
            'EQ',
            // Import all cases prior to a given day.
            'LT',
        ],
    },
});

export type DateFilterDocument = mongoose.Document & {
    numDaysBeforeToday: number;
    op: string;
};

export const automationSchema = new mongoose.Schema({
    parser: parserSchema,
    regexParsing: regexParsingSchema,
    schedule: {
        type: scheduleSchema,
        required: true,
    },
    dateFilter: dateFilterSchema,
});

export type AutomationDocument = mongoose.Document & {
    parser: ParserDocument;
    regexParsing: RegexParsingDocument;
    schedule: ScheduleDocument;
    dateFilter: DateFilterDocument;
};
