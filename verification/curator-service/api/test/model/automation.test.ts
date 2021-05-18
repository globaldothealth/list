import {
    AutomationDocument,
    automationParsingValidator,
    automationSchema,
} from '../../src/model/automation';

import { Error } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import _ from 'lodash';
import fullModel from './data/automation.full.json';
import minimalModel from './data/automation.minimal.json';
import mongoose from 'mongoose';
import regexParsingModel from './data/regex-parsing.full.json';

let mongoServer: MongoMemoryServer;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
});

afterAll(async () => {
    return mongoServer.stop();
});

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
    it('an automation without a schedule is valid', async () => {
        const missingSchedule = _.cloneDeep(fullModel);
        delete missingSchedule.schedule;

        return new Automation(missingSchedule).validate();
    });

    it('an automation with both a parser and regexParsing is invalid', async () => {
        const bothParsing = {
            ...fullModel,
            regexParsing: regexParsingModel,
        };
        const wrapper = { automation: bothParsing };

        return new Wrapper(wrapper).validate((e) => {
            expect(e).not.toBeNull();
            if (e)
                expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a fully specified automation with parser is valid', async () => {
        return new Automation(fullModel).validate();
    });

    it('a fully specified automation with regexParsing is valid', async () => {
        const justRegexParsing = {
            ..._.cloneDeep(fullModel),
            regexParsing: regexParsingModel,
        };
        delete justRegexParsing.parser;

        return new Automation(justRegexParsing).validate();
    });

    it('a minimal automation with neither parser nor regexParsing is valid', async () => {
        return new Automation(minimalModel).validate();
    });
});
