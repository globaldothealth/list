import {
    RegexParsingDocument,
    regexParsingSchema,
} from '../../src/model/regex-parsing';

import { Error } from 'mongoose';
import fullModel from './data/regex-parsing.full.json';
import mongoose from 'mongoose';
import _ from 'lodash';

const RegexPasing = mongoose.model<RegexParsingDocument>(
    'RegexParsing',
    regexParsingSchema,
);

describe('validate', () => {
    it('a regex-parsing without any fields is invalid', async () => {
        return new RegexPasing({}).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a regex-parsing with fields missing a name is invalid', async () => {
        const missingName = { ..._.cloneDeep(fullModel) };
        delete missingName.fields[0].name;

        return new RegexPasing(missingName).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a regex-parsing with fields missing a regex is invalid', async () => {
        const missingRegex = { ..._.cloneDeep(fullModel) };
        delete missingRegex.fields[0].regex;

        return new RegexPasing(missingRegex).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a fully specified regex-parsing is valid', async () => {
        return new RegexPasing(_.cloneDeep(fullModel)).validate();
    });
});
