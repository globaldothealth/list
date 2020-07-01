import mongoose from 'mongoose';
import { uniqueStringsArrayFieldInfo } from './unique-strings-array';

export const preexistingConditionsSchema = new mongoose.Schema({
    values: uniqueStringsArrayFieldInfo,
    status: Boolean,
});

export type PreexistingConditionsDocument = mongoose.Document & {
    values: [string];
    hasPreexistingConditions: boolean;
};
