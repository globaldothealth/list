import {
    AutomationDocument,
    automationParsingValidator,
    automationSchema,
} from './automation';
import { OriginDocument, originSchema } from './origin';

import mongoose from 'mongoose';
import { uploadSchema, UploadDocument } from './upload';
import { dateFilterSchema, DateFilterDocument } from './date-filter';

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
    uploads: [uploadSchema],
    dateFilter: dateFilterSchema,
    notificationRecipients: [String],
});

sourceSchema.methods.toAwsStatementId = function (): string {
    return this._id.toString();
};
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
    uploads: [UploadDocument];
    dateFilter: DateFilterDocument;
    notificationRecipients: string[];

    toAwsStatementId(): string;
    toAwsRuleDescription(): string;
    toAwsRuleName(): string;
    toAwsRuleTargetId(): string;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
