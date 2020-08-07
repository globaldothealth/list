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

const dedupeStrategySchema = new mongoose.Schema({
    // Only imports data up to the given number of days before today.
    onlyParseCasesUpToDaysBefore: Number,
    // Only imports data from a given day before today.
    onlyParseCasesFromDayBefore: Number,
});

export type DedupeStrategyDocument = mongoose.Document & {
    onlyParseCasesUpToDaysBefore: number;
    onlyParseCasesFromDayBefore: number;
};

export const automationSchema = new mongoose.Schema({
    parser: parserSchema,
    regexParsing: regexParsingSchema,
    schedule: {
        type: scheduleSchema,
        required: true,
    },
    dedupeStrategy: dedupeStrategySchema,
});

export type AutomationDocument = mongoose.Document & {
    parser: ParserDocument;
    regexParsing: RegexParsingDocument;
    schedule: ScheduleDocument;
    dedupeStrategy: DedupeStrategyDocument;
};
