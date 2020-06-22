import { TravelDocument, travelSchema } from './travel';

import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const travelHistorySchema = new mongoose.Schema({
    numLocations: positiveIntFieldInfo,
    travel: [travelSchema],
    traveledPrior30Days: Boolean,
});

export type TravelHistoryDocument = mongoose.Document & {
    numLocations: number;
    travel: [TravelDocument];
    traveledPrior30Days: boolean;
};
