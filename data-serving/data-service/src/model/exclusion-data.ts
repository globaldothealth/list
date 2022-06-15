import mongoose from 'mongoose';
import validateEnv from '../util/validate-env';
import { dateFieldInfo } from './date';

export const exclusionDataSchema = new mongoose.Schema(
    {
        date: dateFieldInfo(validateEnv().OUTBREAK_DATE),
        note: String,
    },
    { _id: false },
);

export type ExclusionDataDocument = mongoose.Document & {
    /** Foreign key to the sources collection. */
    date: Date;

    /** The original id of the case in the source.  */
    note: string;
};
