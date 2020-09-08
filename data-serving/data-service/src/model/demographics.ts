import { Range } from './range';
import mongoose from 'mongoose';

export const demographicsSchema = new mongoose.Schema(
    {
        ageRange: {
            start: {
                type: Number,
                min: 0,
                max: 120,
            },
            end: {
                type: Number,
                min: 0,
                max: 120,
            },
            _id: false,
        },
        gender: String,
        occupation: String,
        nationalities: [String],
        ethnicity: String,
    },
    { _id: false },
);

export type DemographicsDocument = mongoose.Document & {
    ageRange: Range<number>;
    gender: string;
    occupation: string;
    nationalities: [string];
    ethnicity: string;
};

export const Demographics = mongoose.model<DemographicsDocument>(
    'Demographics',
    demographicsSchema,
);
