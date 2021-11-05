import {
    AutomationDocument,
    automationParsingValidator,
    automationSchema,
} from './automation';
import { DateFilterDocument, dateFilterSchema } from './date-filter';
import { OriginDocument, originSchema } from './origin';
import { UploadDocument, uploadSchema } from './upload';
import iso from 'iso-3166-1';
import mongoose from 'mongoose';

interface ISource {
    _id: mongoose.Types.ObjectId;
    name: string;
    countryCodes: string[];
    origin: OriginDocument;
    format: string;
    excludeFromLineList: boolean;
    hasStableIdentifiers: boolean;
    automation: AutomationDocument;
    uploads: UploadDocument[];
    dateFilter: DateFilterDocument;
    notificationRecipients: string[];

    toAwsStatementId(): string;
    toAwsRuleDescription(): string;
    toAwsRuleName(): string;
    toAwsRuleTargetId(): string;
}

type ISourceInstanceCreation = mongoose.Model<ISource>;

const validCountryCode = function(cc: string): boolean {
    // use ZZ to represent all countries
    return (iso.whereAlpha2(cc) !== undefined || cc.toUpperCase() === "ZZ")
}

const sourceSchema = new mongoose.Schema<
    ISource,
    ISourceInstanceCreation,
    ISource
>({
    name: {
        type: String,
        required: [true, 'Enter a name'],
    },
    origin: {
        type: originSchema,
        required: [true, 'Enter an origin'],
    },
    countryCodes: {
        type: [String],
        validate: {
            validator: function(cc: string[]): boolean {
                return cc.every(validCountryCode)
            }
        },
        message: 'Invalid country code entered'
    },
    format: String,
    excludeFromLineList: Boolean,
    hasStableIdentifiers: Boolean,
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

export type SourceDocument = mongoose.Document & ISource;

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);