import { IParser, parserSchema } from './parser';
import { IRegexParsing, regexParsingSchema } from './regex-parsing';
import { ISchedule, scheduleSchema } from './schedule';

import mongoose from 'mongoose';

export const automationSchema = new mongoose.Schema({
    parser: parserSchema,
    regexParsing: regexParsingSchema,
    schedule: scheduleSchema,
});

export type IAutomation = {
    parser: IParser;
    regexParsing: IRegexParsing;
    schedule: ISchedule;
    // TODO remove this when source is no longer a Mongoose document
    modifiedPaths: () => [string];
};

