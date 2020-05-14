import { DateRangeDocument, dateRangeSchema } from './date-range';
import { LocationDocument, locationSchema } from './location';

import mongoose from 'mongoose';

export enum TravelPurpose {
    Family = 'Family',
    Conference = 'Conference',
    Work = 'Work',
}

export const travelSchema = new mongoose.Schema(
    {
        location: locationSchema,
        dateRange: dateRangeSchema,
        purpose: {
            type: String,
            enum: Object.values(TravelPurpose),
        },
        additionalInformation: String,
    },
    {
        strict: true,
    },
);

export type TravelDocument = mongoose.Document & {
    location: LocationDocument;
    dateRange: DateRangeDocument;
    purpose: TravelPurpose;
    additionalInformation: string;
};
