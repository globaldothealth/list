import mongoose from 'mongoose';

export const scheduleSchema = new mongoose.Schema({
    awsRuleArn: {
        type: String,
        required: 'Enter a CloudWatch schedule rule AWS Lambda ARN',
        match: [/^arn\:aws\:events\:.+\:.+\:rule\/.+/],
    },
    awsScheduleExpression: {
        type: String,
        required: 'Enter a CloudWatch rule schedule expression',
        // Rough match for the official syntax.
        // E.g., "rate(2 days)", or "cron(0 10 * * ? *)".
        // For the full definition, see:
        //   https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents-expressions.html
        match: [
            /^((rate\(((1 (minute|hour|day))|([1-9]+ (minutes|hours|days)))\))|(cron\((.+\s){5}.+\)))/,
        ],
    },
});

export type ScheduleDocument = mongoose.Document & {
    awsRuleArn: string;
    awsScheduleExpression: string;
};
