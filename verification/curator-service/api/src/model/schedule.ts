import mongoose from 'mongoose';

export const scheduleSchema = new mongoose.Schema({
    // Non-required for now. This is semantically required in the data layer,
    // but until we can replace Mongoose validation of API requests with
    // something like OpenAPI spec validation, this must be non-required to
    // facilitate validating create requests (which don't yet have an ARN).
    awsRuleArn: {
        type: String,
        match: [/^arn\:aws\:events\:.+\:.+\:rule\/.+/],
    },
    awsScheduleExpression: {
        type: String,
        required: 'Enter a CloudWatch rule schedule expression',
        // Rough match for the official syntax.
        // E.g., "rate(2 days)", or "cron(0 10 * * ? *)".
        // For the full definition, see:
        // https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-schedule-expressions.html
        match: [
            /^((rate\(((1 (minute|hour|day))|([1-9]+ (minutes|hours|days)))\))|(cron\((.+\s){5}.+\)))/,
        ],
    },
});

export type ScheduleDocument = mongoose.Document & {
    awsRuleArn: string;
    awsScheduleExpression: string;
};
