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
        match: [
            /^((rate\(((1 (minute|hour|day))|([1-9]+ (minutes|hours|days)))\))|(cron\((.+\s){5}.+\)))/,
        ],
    },
});

export type ScheduleDocument = mongoose.Document & {
    awsRuleArn: string;
    awsScheduleExpression: string;
};
