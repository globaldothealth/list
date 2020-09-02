import { TravelDocument, travelSchema } from './travel';

import mongoose from 'mongoose';

export const travelHistorySchema = new mongoose.Schema(
    {
        travel: [travelSchema],
        traveledPrior30Days: Boolean,
    },
    { _id: false },
);

export type TravelHistoryDocument = mongoose.Document & {
    travel: [TravelDocument];
    traveledPrior30Days: boolean;
};
