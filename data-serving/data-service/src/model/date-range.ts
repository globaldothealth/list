import { Range } from './range';
import { dateFieldInfo } from './date';
import mongoose from 'mongoose';

export const dateRangeSchema = new mongoose.Schema(
    {
        start: dateFieldInfo,
        end: dateFieldInfo,
    },
    { _id: false },
);

export type DateRangeDocument = mongoose.Document & Range<Date>;
