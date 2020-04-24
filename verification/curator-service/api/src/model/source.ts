import mongoose from 'mongoose';

interface Origin {
    url: string;
    license: string;
}

const originSchema = new mongoose.Schema({
    url: {
        type: String,
        required: 'Enter an origin URL',
    },
    license: {
        type: String,
    },
});

interface Field {
    name: string;
    regexp: string;
}

const fieldSchema = new mongoose.Schema({
    url: {
        type: String,
        required: 'Enter a dotted.field.name',
    },
    regexp: {
        type: String,
        required: 'Enter a field extraction regexp',
    },
});

interface Parsing {
    fields: Array<Field>;
}

const parsingSchema = new mongoose.Schema({
    fields: [fieldSchema],
});

interface Automation {
    name: string;
    tag: string;
    active: boolean;
    scheduleExpression: string;
    parsing: Parsing;
}

const automationSchema = new mongoose.Schema({
    name: {
        name: String,
        tag: String,
        active: Boolean,
        // TODO: Should probably use a validator for "cron(..." or "rate(...".
        scheduleExpression: String,
        parsing: parsingSchema,
    },
});

const sourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a name',
    },
    origin: {
        type: originSchema,
        required: 'Enter an origin',
    },
    format: String,
    automation: automationSchema,
});

type SourceDocument = mongoose.Document & {
    name: string;
    origin: Origin;
    format: string;
    automation: Automation;
};

export const Source = mongoose.model<SourceDocument>('Source', sourceSchema);
