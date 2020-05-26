import {
    AutomationDocument,
    automationParsingValidator,
    automationSchema,
} from '../../src/model/automation';

import { Error } from 'mongoose';
import fullModel from './data/automation.full.json';
import regexParsingModel from './data/regex-parsing.full.json';
import mongoose from 'mongoose';

const Automation = mongoose.model<AutomationDocument>(
    'Automation',
    automationSchema,
);

// Used to test automationParsingValidator.
const wrapperSchema = new mongoose.Schema({
    automation: {
        type: automationSchema,
        validate: automationParsingValidator,
    },
});
type WrapperDocument = mongoose.Document & { automation: AutomationDocument };
const Wrapper = mongoose.model<WrapperDocument>('Wrapper', wrapperSchema);

describe('validate', () => {
    it('an automation without a schedule is invalid', async () => {
        const missingSchedule = { ...fullModel };
        delete missingSchedule.schedule;

        return new Automation(missingSchedule).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an automation without either a parser or regexParsing is invalid', async () => {
        const noParsing = { ...fullModel };
        delete noParsing.parser;
        const wrapper = { automation: noParsing };

        return new Wrapper(wrapper).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an automation with both a parser and regexParsing is invalid', async () => {
        const bothParsing = { ...fullModel, regexParsing: regexParsingModel };
        const wrapper = { automation: bothParsing };

        return new Wrapper(wrapper).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a fully specified automation with parser is valid', async () => {
        return new Automation(fullModel).validate();
    });

    it('a fully specified automation with regexParsing is valid', async () => {
        const justRegexParsing = {
            ...fullModel,
            regexParsing: regexParsingModel,
        };
        delete justRegexParsing.parser;

        return new Automation(justRegexParsing).validate();
    });
});
