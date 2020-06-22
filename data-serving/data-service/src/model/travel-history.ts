import { TravelDocument, travelSchema } from './travel';

import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const travelHistorySchema = new mongoose.Schema({
    travel: [travelSchema],
    traveledPrior30Days: Boolean,
    numLocations: positiveIntFieldInfo,
});

export type TravelHistoryDocument = mongoose.Document & {
    travel: [TravelDocument];
    traveledPrior30Days: boolean;
    numLocations: number;
};
