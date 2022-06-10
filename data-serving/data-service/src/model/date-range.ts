import { Range } from './range';
import { dateFieldInfo } from './date';
import mongoose from 'mongoose';
import validateEnv from '../util/validate-env';

const datesWithinOutbreak = dateFieldInfo(validateEnv().OUTBREAK_DATE);

export const dateRangeSchema = new mongoose.Schema(
    {
        start: datesWithinOutbreak,
        end: datesWithinOutbreak,
    },
    { _id: false },
);

export type DateRangeDocument = mongoose.Document & Range<Date>;
