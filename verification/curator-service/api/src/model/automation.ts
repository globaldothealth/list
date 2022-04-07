import { IParser } from './parser';
import { IRegexParsing } from './regex-parsing';
import { ISchedule } from './schedule';

export type IAutomation = {
    parser: IParser;
    regexParsing: IRegexParsing;
    schedule: ISchedule;
    // TODO remove this when source is no longer a Mongoose document
    modifiedPaths: () => [string];
};

