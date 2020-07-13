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
        sex: String,
        // TODO: The below 3 fields should be data dictionaries.
        profession: String,
        nationalities: [String],
        ethnicity: String,
    },
    { _id: false },
);

export type DemographicsDocument = mongoose.Document & {
    ageRange: Range<number>;
    sex: string;
    profession: string;
    nationalities: [string];
    ethnicity: string;
};
