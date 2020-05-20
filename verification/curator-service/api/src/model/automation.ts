import mongoose from 'mongoose';
import { ParserDocument, parserSchema } from './parser';
import { RegexParsingDocument, regexParsingSchema } from './regex-parsing';
import { ScheduleDocument, scheduleSchema } from './schedule';

export const automationParsingValidator = {
    validator: (automation: AutomationDocument): boolean => {
        return (
            (automation.parser != null || automation.regexParsing != null) &&
            !(automation.parser != null && automation.regexParsing != null)
        );
    },
    message: 'Exactly one of either parser or regexParsing must be supplied.',
};

export const automationSchema = new mongoose.Schema({
    parser: parserSchema,
    regexParsing: regexParsingSchema,
    schedule: {
        type: scheduleSchema,
        required: true,
    },
});

export type AutomationDocument = mongoose.Document & {
    parser: ParserDocument;
    regexParsing: RegexParsingDocument;
    schedule: ScheduleDocument;
};
