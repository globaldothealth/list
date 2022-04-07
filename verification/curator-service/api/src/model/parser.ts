import mongoose from 'mongoose';

export const parserSchema = new mongoose.Schema({
    awsLambdaArn: {
        type: String,
        required: 'Enter a parser AWS Batch Job Definition ARN or function name',
    },
});

export type IParser = {
    awsLambdaArn: string;
}
