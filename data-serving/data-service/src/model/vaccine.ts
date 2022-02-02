import mongoose from 'mongoose';
import { symptomsSchema, SymptomsDocument } from './symptoms';

export const vaccineSchema = new mongoose.Schema(
    {
        name: String,
        batch: String,
        date: Date,
        sideEffects: symptomsSchema,
        previousInfection: String,
        previousInfectionDetectionMethod: String,
    },
    { _id: false },
);

export type VaccineDocument = mongoose.Document & {
    name: string;
    batch: string;
    date: Date;
    sideEffects: SymptomsDocument & { status: "Symptomatic" };
    previousInfection: 'yes' | 'no' | 'NA';
    previousInfectionDetectionMethod: string;
};
