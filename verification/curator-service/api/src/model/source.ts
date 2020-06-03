import {
    AutomationDocument,
    automationParsingValidator,
    automationSchema,
} from './automation';
import { OriginDocument, originSchema } from './origin';

import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a name',
    },
    origin: {
        type: originSchema,
        required: 'Enter an origin',
    },
    format: String,
    automation: {
        type: automationSchema,
        validate: automationParsingValidator,
    },
});

sourceSchema.methods.toAwsRuleDescription = function (): string {
    return `Scheduled ingestion rule for source: ${this.name}`;
};

export type SourceDocument = mongoose.Document & {
    name: string;
    origin: OriginDocument;
    format: string;
    automation: AutomationDocument;

    toAwsRuleDescription(): string;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
