import mongoose from 'mongoose';

// this is a minimal schema—the canonical version is in verification/curator-service/api/src/model

const sourceSchema = new mongoose.Schema({
    excludeFromLineList: Boolean,
});

export type SourceDocument = mongoose.Document & {
    _id: mongoose.Types.ObjectId;
    excludeFromLineList: boolean;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
