import { DateRangeDocument, dateRangeSchema } from './date-range';
import { LocationDocument, locationSchema } from './location';

import mongoose from 'mongoose';

export enum TravelPurpose {
    Business = 'Business',
    Leisure = 'Leisure',
    Family = 'Family',
    Other = 'Other',
    Unknown = 'Unknown',
}

export enum TravelMethod {
    Bus = 'Bus',
    Car = 'Car',
    Coach = 'Coach',
    Ferry = 'Ferry',
    Plane = 'Plane',
    Train = 'Train',
    Other = 'Other',
    Unknown = 'Unknown'
}

export const travelSchema = new mongoose.Schema({
    location: locationSchema,
    dateRange: dateRangeSchema,
    purpose: {
        type: String,
        enum: Object.values(TravelPurpose),
    },
    method: {
        type: String,
        enum: Object.values(TravelMethod),
    },
});

export type TravelDocument = mongoose.Document & {
    dateRange: DateRangeDocument;
    location: LocationDocument;
    method: TravelMethod;
    purpose: TravelPurpose;
};
