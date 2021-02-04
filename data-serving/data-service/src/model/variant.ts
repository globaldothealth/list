import mongoose from 'mongoose';

export const variantSchema = new mongoose.Schema(
    {
        name: String,
    },
    { _id: false },
);

export type VariantDocument = mongoose.Document & {
    name: string;
};
