import { Range } from './range';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

/*
 * There are separate types for demographics for data storage (the mongoose document) and
 * for data transfer (DemographicsDTO). The DTO only has an age range, and is what the cases
 * controller receives and transmits over the network. The mongoose document has both an age
 * range and age buckets, and is what gets written to the database. The end goal is that the
 * mongoose document only has age buckets, and that the cases controller converts between the
 * two so that outside you only see a single age range.
 */

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

export type DemographicsDTO = {
    ageRange?: Range<number>;
    gender: string;
    occupation: string;
    nationalities: [string];
    ethnicity: string;
}

export type DemographicsDocument = mongoose.Document & DemographicsDTO & {
    ageBuckets: ObjectId[];
};

export const Demographics = mongoose.model<DemographicsDocument>(
    'Demographics',
    demographicsSchema,
);
