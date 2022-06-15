import { Range } from './range';
import mongoose, { LeanDocument } from 'mongoose';
import { ObjectId } from 'mongodb';
import { AgeBucket } from './age-bucket';

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
        gender: String,
        occupation: String,
        nationalities: [String],
        ethnicity: String,
    },
    { _id: false },
);

type DemographicsCommonFields = {
    gender: string;
    occupation: string;
    nationalities: [string];
    ethnicity: string;
};

export type DemographicsDTO = DemographicsCommonFields & {
    ageRange?: Range<number>;
}

export type DemographicsDocument = mongoose.Document & DemographicsCommonFields & {
    ageBuckets: ObjectId[];
};

export const Demographics = mongoose.model<DemographicsDocument>(
    'Demographics',
    demographicsSchema,
);

export const demographicsAgeRange = async (demographics: LeanDocument<DemographicsDocument>) => {
    if (
        demographics &&
        demographics.ageBuckets &&
        demographics.ageBuckets.length > 0
    ) {
        const ageBuckets = await Promise.all(
            demographics.ageBuckets.map((bucketId) => {
                return AgeBucket.findById(bucketId).lean();
            }),
        );
        const minimumAge = Math.min(...ageBuckets.map((b) => b!.start));
        const maximumAge = Math.max(...ageBuckets.map((b) => b!.end));
        return {
            start: minimumAge,
            end: maximumAge,
        };
    } else {
        return undefined;
    }
};
