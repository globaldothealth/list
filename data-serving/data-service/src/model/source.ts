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

export const sourceSchema = new mongoose.Schema({
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
});

export type SourceDocument = mongoose.Document & {
    id: string;
    url: string;
    other: string;
};
