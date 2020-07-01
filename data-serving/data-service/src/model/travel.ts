import { DateRangeDocument, dateRangeSchema } from './date-range';
import { LocationDocument, locationSchema } from './location';

import mongoose from 'mongoose';

export enum TravelPurpose {
    Business = 'Business',
    Leisure = 'Leisure',
    Family = 'Family',
    Other = 'Other',
}

export enum TravelMethod {
    Bus = 'Bus',
    Car = 'Car',
    Coach = 'Coach',
    Ferry = 'Ferry',
    Plane = 'Plane',
    Train = 'Train',
    Other = 'Other',
}

export const travelSchema = new mongoose.Schema(
    {
        dateRange: dateRangeSchema,
        location: locationSchema,
        methods: [
            {
                type: String,
                enum: Object.values(TravelMethod),
            },
        ],
        purpose: {
            type: String,
            enum: Object.values(TravelPurpose),
        },
    },
    { _id: false },
);

export type TravelDocument = mongoose.Document & {
    dateRange: DateRangeDocument;
    location: LocationDocument;
    methods: [TravelMethod];
    purpose: TravelPurpose;
};
