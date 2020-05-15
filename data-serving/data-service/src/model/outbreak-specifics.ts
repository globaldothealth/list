import mongoose from 'mongoose';

export const outbreakSpecificsSchema = new mongoose.Schema({
    livesInWuhan: Boolean,
    reportedMarketExposure: Boolean,
});

export type OutbreakSpecificsDocument = mongoose.Document & {
    livesInWuhan: boolean;
    reportedMarketExposure: boolean;
};
