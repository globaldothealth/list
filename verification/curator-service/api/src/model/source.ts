import {
    AutomationDocument,
    automationParsingValidator,
    automationSchema,
} from './automation';
import { DateFilterDocument, dateFilterSchema } from './date-filter';
import { OriginDocument, originSchema } from './origin';
import { UploadDocument, uploadSchema } from './upload';

import mongoose from 'mongoose';
import { SourceSchema } from 'aws-sdk/clients/kinesisanalytics';

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
    excludeFromLineList: Boolean,
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
    const source = this as SourceDocument;
    return `Scheduled ingestion rule for source: ${source.name}`;
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
    excludeFromLineList: boolean,
    automation: AutomationDocument;
    uploads: UploadDocument[];
    dateFilter: DateFilterDocument;
    notificationRecipients: string[];

    toAwsStatementId(): string;
    toAwsRuleDescription(): string;
    toAwsRuleName(): string;
    toAwsRuleTargetId(): string;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
