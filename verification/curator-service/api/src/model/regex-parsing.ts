import mongoose from 'mongoose';

interface Field {
    name: string;
    regex: string;
}

const fieldSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a dotted.field.name',
    },
    regex: {
        type: String,
        required: 'Enter a field extraction regex',
    },
});

export const regexParsingSchema = new mongoose.Schema({
    fields: {
        type: [fieldSchema],
        required: true,
        validate: {
            validator: (fields: [Field]): boolean => fields.length > 0,
            message: 'Must include one or more fields',
        },
    },
});

export type RegexParsingDocument = mongoose.Document & {
    fields: [Field];
};
