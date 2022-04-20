import { Range } from './range';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export const demographicsSchema = new mongoose.Schema(
    {
        /*
         * The idea is that the age buckets are an enumeration supplied in the database,
         * so you can refer to them here in the ageBuckets collection but you shouldn't
         * make up your own age ranges.
         * 
         * A case can belong to zero age buckets if it didn't specify an age, and more
         * than one age bucket if the age range specified in the case overlapped more
         * than one of the buckets we use.
         */
        ageBuckets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ageBuckets' }],
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
    ageBuckets: ObjectId[];
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
