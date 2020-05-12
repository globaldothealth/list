import mongoose from 'mongoose';

const fieldRequiredValidator = [
    function (this: SourceDocument) {
        return (
            this != null &&
            this.id == null &&
            this.url == null &&
            this.other == null
        );
    },
    'Source must specify id, url, or other',
];

export const sourceSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: fieldRequiredValidator,
        },
        url: {
            type: String,
            required: fieldRequiredValidator,
        },
        other: {
            type: String,
            required: fieldRequiredValidator,
        },
    },
    { strict: true },
);

export type SourceDocument = mongoose.Document & {
    id: string;
    url: string;
    other: string;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
