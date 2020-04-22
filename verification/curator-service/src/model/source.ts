import mongoose from 'mongoose';

interface Origin {
    url: string;
    license: string;
}

const originSchema = new mongoose.Schema({
    url: {
        type: String,
        required: 'Enter an origin URL',
    },
    license: {
        type: String,
    },
});

const sourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a name',
    },
    origin: originSchema,
});

type SourceDocument = mongoose.Document & {
    name: string;
    origin: Origin;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
