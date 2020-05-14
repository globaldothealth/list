import mongoose from 'mongoose';

/**
 * Schema for a field that follows a dictionary value format, where some values
 * are explicitly provided and others are imputed. Examples include the symptoms
 * and chronic disease fields.
 */
export const dictionarySchema = new mongoose.Schema({
    provided: {
        type: [String],
        uniqueItems: true,
    },
    imputed: {
        type: [String],
        uniqueItems: true,
    },
});

export type DictionaryDocument = mongoose.Document & {
    provided: [string];
    imputed: [string];
};
