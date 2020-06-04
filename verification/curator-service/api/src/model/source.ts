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

sourceSchema.methods.toAwsRuleName = function (): string {
    return this._id.toString();
};

sourceSchema.methods.toAwsRuleTargetId = function (): string {
    return `${this._id}_Target`;
};

export type SourceDocument = mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    name: string;
    origin: OriginDocument;
    format: string;
    automation: AutomationDocument;

    toAwsRuleDescription(): string;
    toAwsRuleName(): string;
    toAwsRuleTargetId(): string;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
