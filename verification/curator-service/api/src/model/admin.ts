import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    id: {
        type: String,
        required: 'Admin must have an id',
        index: true,
    },
    name: {
        type: String,
        required: 'Admin must have a name',
    },
});

export type AdminDocument = mongoose.Document & {
    id: string;
    name: string;
};

export const Admin = mongoose.model<AdminDocument>('Admin', adminSchema);
