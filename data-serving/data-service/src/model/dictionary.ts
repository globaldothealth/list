import mongoose from 'mongoose';

const uniqueValuesValidator = {
    validator: function (values: [string]): boolean {
        const unique = new Set(values);
        return values.length == unique.size;
    },
    message: 'Dictionary values must be unique',
};

/**
 * Schema for a field that follows a dictionary value format, where some values
 * are explicitly provided and others are imputed. Examples include the symptoms
 * and chronic disease fields.
 */
export const dictionarySchema = new mongoose.Schema({
    values: {
        type: [String],
        validate: uniqueValuesValidator,
    },
    status: String,
});

export type DictionaryDocument = mongoose.Document & {
    values: [string];
    status: string;
};
