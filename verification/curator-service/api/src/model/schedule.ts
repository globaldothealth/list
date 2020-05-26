import mongoose from 'mongoose';

export const scheduleSchema = new mongoose.Schema({
    awsRuleArn: {
        type: String,
        required: 'Enter a CloudWatch schedule rule AWS Lambda ARN',
        match: [/^arn\:aws\:events\:.+\:.+\:rule\/.+/],
    },
});

export type ScheduleDocument = mongoose.Document & {
    awsRuleArn: string;
};
