import mongoose from 'mongoose';

const fieldRequiredValidator = [
    function (this: SourceDocument): boolean {
        return this != null && this.url == null && this.other == null;
    },
    'Source must specify id, url, or other',
];

export const sourceSchema = new mongoose.Schema({
    url: {
        type: String,
        required: fieldRequiredValidator,
    },
    other: {
        type: String,
        required: fieldRequiredValidator,
    },
});

export type SourceDocument = mongoose.Document & {
    url: string;
    other: string;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
