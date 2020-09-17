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

/**
 * An admin is an administrative area as per mapbox boundaries API.
 * Cf. https://docs.mapbox.com/help/tutorials/get-started-mapbox-boundaries/
 */
export const Admin = mongoose.model<AdminDocument>('Admin', adminSchema);
