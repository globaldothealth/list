import mongoose from 'mongoose';
import { uniqueStringsArrayFieldInfo } from './unique-strings-array';

export const symptomsSchema = new mongoose.Schema(
    {
        values: uniqueStringsArrayFieldInfo,
        status: String,
    },
    { _id: false },
);

export type SymptomsDocument = mongoose.Document & {
    values: [string];
    status: string;
};
