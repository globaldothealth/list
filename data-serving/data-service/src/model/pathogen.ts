import mongoose from 'mongoose';
import { positiveIntFieldInfo } from './positive-int';

export const pathogenSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        id: {
            ...positiveIntFieldInfo,
            required: true,
        },
    },
    { _id: false },
);

export type PathogenDocument = mongoose.Document & {
    name: string;
    id: string;
};
