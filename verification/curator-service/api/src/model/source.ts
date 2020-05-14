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

interface RegexParsing {
    fields: Array<Field>;
}

const regexParsingSchema = new mongoose.Schema({
    fields: [fieldSchema],
});

interface Parser {
    awsLambdaArn: string;
}

const parserSchema = new mongoose.Schema({
    awsLambdaArn: {
        type: String,
        required: 'Enter a parser AWS Lambda ARN',
    },
});

interface Schedule {
    awsRuleArn: string;
}

const scheduleSchema = new mongoose.Schema({
    awsRuleArn: {
        type: String,
        required: 'Enter a CloudWatch schedule rule AWS Lambda ARN',
    },
});

interface Automation {
    parser: Parser;
    schedule: Schedule;
    regexParsing: RegexParsing;
}

const automationSchema = new mongoose.Schema({
    parser: parserSchema,
    schedule: scheduleSchema,
    regexParsing: regexParsingSchema,
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
