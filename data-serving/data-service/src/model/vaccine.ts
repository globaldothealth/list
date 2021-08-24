import mongoose from 'mongoose';
import { symptomsSchema, SymptomsDocument } from './symptoms';

export const vaccineSchema = new mongoose.Schema(
    {
        name: String,
        date: Date,
        sideEffects: [symptomsSchema],
        previousInfection: String,
        previousInfectionDetectionMethod: String,
    },
    { _id: false },
);

export type VaccineDocument = mongoose.Document & {
    name: string;
    date: Date;
    sideEffects: [SymptomsDocument];
    previousInfection: 'yes' | 'no' | 'NA';
    previousInfectionDetectionMethod: string;
};
