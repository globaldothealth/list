import mongoose from 'mongoose';
import { uniqueStringsArrayFieldInfo } from './unique-strings-array';

export const symptomsSchema = new mongoose.Schema({
    values: uniqueStringsArrayFieldInfo,
    status: String,
});

export type SymptomsDocument = mongoose.Document & {
    values: [string];
    status: string;
};
