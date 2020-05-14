import { Range } from './range';
import mongoose from 'mongoose';

export enum Sex {
    Female = 'Female',
    Male = 'Male',
    Other = 'Other',
}

export enum Species {
    HomoSapien = 'Homo sapien',
}

export const demographicsSchema = new mongoose.Schema({
    ageRange: {
        start: {
            type: Number,
            min: -1,
            max: 300,
        },
        end: {
            type: Number,
            min: -1,
            max: 300,
        },
    },
    species: {
        type: String,
        enum: Object.values(Species),
    },
    sex: {
        type: String,
        enum: Object.values(Sex),
    },
});

export type DemographicsDocument = mongoose.Document & {
    ageRange: Range<number>;
    sex: Sex;
    species: Species;
};
