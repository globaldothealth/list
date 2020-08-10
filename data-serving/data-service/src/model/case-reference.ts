import mongoose from 'mongoose';

export const caseReferenceSchema = new mongoose.Schema(
    {
        sourceId: {
            type: String,
            required: true,
        },
        sourceEntryId: String,
        sourceUrl: {
            type: String,
            required: true,
        },
        uploadId: String,
        additionalSources: [
            {
                sourceUrl: String,
                _id: false,
            },
        ],
    },
    { _id: false },
);

export type CaseReferenceDocument = mongoose.Document & {
    /** Foreign key to the sources collection. */
    sourceId: string;

    /** The original id of the case in the source.  */
    sourceEntryId: string;

    /** The URL of the source of the case data at the time of ingestion. */
    sourceUrl: string;

    /** The UUID of the upload by which this case was entered into the DB. */
    uploadId: string;

    additionalSources: [
        {
            sourceUrl: string;
        },
    ];
};
