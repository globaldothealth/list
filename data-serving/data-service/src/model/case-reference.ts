import mongoose from 'mongoose';

export const caseReferenceSchema = new mongoose.Schema({
    sourceId: {
        type: String,
        required: true,
    },
    sourceEntryId: String,
    sourceUrl: {
        type: String,
        required: true,
    },
    additionalSources: [
        {
            sourceUrl: String,
        },
    ],
});

export type CaseReferenceDocument = mongoose.Document & {
    /** Foreign key to the sources collection. */
    sourceId: string;

    /** The original id of the case in the source.  */
    sourceEntryId: string;

    /** The URL of the source of the case data at the time of ingestion. */
    sourceUrl: string;

    additionalSources: [
        {
            sourceUrl: string;
        },
    ];
};
