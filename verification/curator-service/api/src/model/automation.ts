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

export const automationSchema = new mongoose.Schema({
    parser: parserSchema,
    regexParsing: regexParsingSchema,
    schedule: scheduleSchema,
});

export type AutomationDocument = mongoose.Document & {
    parser: ParserDocument;
    regexParsing: RegexParsingDocument;
    schedule: ScheduleDocument;
};
