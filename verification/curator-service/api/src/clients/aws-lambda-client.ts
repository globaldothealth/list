import AWS from 'aws-sdk';
import { logger } from '../util/logger';

/**
 * Client to interact with the AWS Lambda API.
 *
 * This class instantiates the connection to AWS on construction. All
 * connection configuration (including mocking) should occur on the AWS object
 * before construction.
 *
 * For examples on using the Lambda API, see:
 *   https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/lambda-examples.html
 */
export default class AwsLambdaClient {
    private readonly lambdaClient: AWS.Lambda;
    constructor(
        private readonly serviceEnv: string,
        awsRegion: string,
    ) {
        AWS.config.update({ region: awsRegion });
        this.lambdaClient = new AWS.Lambda({
            apiVersion: '2015-03-31',
        });
    }

    /**
     * Invoke welcome email lambda.
     *
     * @param emailAddress - Email address to send welcome message
     */
    sendWelcomeEmail = async (email: string): Promise<void> => {
        const params = {
            FunctionName: 'SendWelcomeEmail',
            Payload: JSON.stringify({
                email_address: email,
            }),
        };

        await this.lambdaClient
            .invoke(params)
            .promise()
            .catch((err) => {
                throw err;
            });
    };
}
