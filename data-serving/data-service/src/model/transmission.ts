import mongoose from 'mongoose';

export const transmissionSchema = new mongoose.Schema(
    {
        // Ids of other cases of people with whom this person had contact.
        linkedCaseIds: [String],
        // Data dictionary.
        places: [String],
        routes: [String],
    },
    { _id: false },
);

export type TransmissionDocument = mongoose.Document & {
    linkedCaseIds: [string];
    places: [string];
    routes: [string];
};
