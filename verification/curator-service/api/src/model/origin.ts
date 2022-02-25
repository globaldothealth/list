import mongoose from 'mongoose';

export const originSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: 'Enter a data source URL',
        },
        license: {
            type: String,
            required: 'Enter a source license',
        },
        providerName: String,
        providerWebsiteUrl: String,
    },
    { _id: false },
);

export type OriginDocument = mongoose.Document & {
    url: string;
    license: string;
    providerName: string;
    providerWebsiteUrl: string;
};
