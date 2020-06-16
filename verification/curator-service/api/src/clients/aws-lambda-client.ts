import {
    AddPermissionRequest,
    RemovePermissionRequest,
} from 'aws-sdk/clients/lambda';

import AWS from 'aws-sdk';
import assertString from '../util/assert-string';

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
    constructor(awsRegion: string) {
        AWS.config.update({ region: awsRegion });
        this.lambdaClient = new AWS.Lambda({
            apiVersion: '2015-03-31',
        });
    }

    /**
     * Proxies an AddPermission request to the AWS Lambda API.
     *
     * For the full API definition, see:
     *   https://docs.aws.amazon.com/lambda/latest/dg/API_AddPermission.html
     */
    addInvokeFromEventPermission = async (
        sourceArn: string,
        functionArn: string,
        statementId: string,
    ): Promise<string> => {
        const addPermissionParams: AddPermissionRequest = {
            FunctionName: functionArn,
            Action: 'lambda:InvokeFunction',
            Principal: 'events.amazonaws.com',
            SourceArn: sourceArn,
            StatementId: statementId,
        };
        const response = await this.lambdaClient
            .addPermission(addPermissionParams)
            .promise();
        assertString(
            response.Statement,
            'AWS AddPermission response missing Statement.',
        );
        return response.Statement;
    };

    removePermission = async (
        functionArn: string,
        statementId: string,
    ): Promise<void> => {
        const removePermissionParams: RemovePermissionRequest = {
            FunctionName: functionArn,
            StatementId: statementId,
        };
        await this.lambdaClient
            .removePermission(removePermissionParams)
            .promise();
    };
}
