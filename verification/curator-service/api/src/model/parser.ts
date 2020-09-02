import mongoose from 'mongoose';

export const parserSchema = new mongoose.Schema({
    awsLambdaArn: {
        type: String,
        required: 'Enter a parser AWS Lambda ARN or function name',
    },
});

export type ParserDocument = mongoose.Document & {
    awsLambdaArn: string;
};
