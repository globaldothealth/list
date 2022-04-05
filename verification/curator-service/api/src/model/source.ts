import {
    IAutomation,
    automationSchema,
} from './automation';
import { IDateFilter, dateFilterSchema } from './date-filter';
import { IOrigin, originSchema } from './origin';
import { IUpload, uploadSchema } from './upload';
import countries from 'i18n-iso-countries';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import db from './database';

interface ISource {
    _id: ObjectId;
    name: string;
    countryCodes: string[];
    origin: IOrigin;
    format: string;
    excludeFromLineList: boolean;
    hasStableIdentifiers: boolean;
    automation: IAutomation;
    uploads: IUpload[];
    dateFilter: IDateFilter;
    notificationRecipients: string[];
}

type ISourceInstanceCreation = mongoose.Model<ISource>;

const validCountryCode = function(cc: string): boolean {
    // use ZZ to represent all countries
    return (countries.getName(cc, 'en') !== undefined || cc.toUpperCase() === "ZZ")
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
    automation: automationSchema,
    uploads: [uploadSchema],
    dateFilter: dateFilterSchema,
    notificationRecipients: [String],
});

export const awsStatementIdForSource = (source: ISource) => source._id.toHexString();

export const awsRuleDescriptionForSource = (source: ISource) => `Scheduled ingestion rule for source: ${source.name}`;

export const awsRuleNameForSource = (source: ISource) => source._id.toHexString();

export const awsRuleTargetIdForSource = (source: ISource) => `${source._id.toHexString()}_Target`;

export type SourceDocument = mongoose.Document & ISource;

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
export const sources = () => db().collection('sources');
