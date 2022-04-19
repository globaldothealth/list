import { IAutomation } from './automation';
import { IDateFilter } from './date-filter';
import { IOrigin } from './origin';
import { IUpload } from './upload';
import { ObjectId } from 'mongodb';
import db from './database';

export interface ISource {
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

export const awsStatementIdForSource = (source: ISource) =>
    source._id.toHexString();

export const awsRuleDescriptionForSource = (source: ISource) =>
    `Scheduled ingestion rule for source: ${source.name}`;

export const awsRuleNameForSource = (source: ISource) =>
    source._id.toHexString();

export const awsRuleTargetIdForSource = (source: ISource) =>
    `${source._id.toHexString()}_Target`;

export const sources = () => db().collection('sources');
