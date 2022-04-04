import { ObjectId } from 'mongodb';
import db from './database';

/*
 * This is a minimal case schema to support some source-related behaviour.
 * The full schema for cases is in the data service.
 */

export type ICase = {
    _id: ObjectId;
    caseReference: {
        sourceId: string,
    },
};

export const cases = () => db().collection('cases');
export const restrictedCases = () => db().collection('restrictedcases');
