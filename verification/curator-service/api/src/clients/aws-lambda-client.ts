import {
    AddPermissionRequest,
    RemovePermissionRequest,
} from 'aws-sdk/clients/lambda';

import AWS from 'aws-sdk';
import assertString from '../util/assert-string';

export interface RetrievalPayload {
    bucket: string;
    key: string;
    upload_id: string;
}

export interface LambdaFunction {
    name: string;
}

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
        private readonly retrievalFunctionArn: string,
        awsRegion: string,
    ) {
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

    /**
     * Invoke retrieval function lambda synchronously, returning its output.
     */
    invokeRetrieval = async (sourceId: string): Promise<RetrievalPayload> => {
        try {
            const res = await this.lambdaClient
                .invoke({
                    FunctionName: this.retrievalFunctionArn,
                    Payload: JSON.stringify({
                        sourceId: sourceId,
                    }),
                })
                .promise();
            if (res.FunctionError) {
                console.error(res);
                throw Error(
                    `Retrieving source "${sourceId}" content: ${res.FunctionError}`,
                );
            }
            // When res.FunctionError is empty, res.Payload is always defined.
            return JSON.parse(
                res.Payload?.toString() || '',
            ) as RetrievalPayload;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    /** Lists the available parser */
    listParsers = async (): Promise<LambdaFunction[]> => {
        try {
            const res = await this.lambdaClient
                .listFunctions({ MaxItems: 10000 })
                .promise();
            return (
                res.Functions?.filter((f) =>
                    f.FunctionName?.includes('ParsingFunction'),
                )?.map<LambdaFunction>((f) => {
                    return { name: f.FunctionName || '' };
                }) || []
            );
        } catch (e) {
            console.error(e);
            throw e;
        }
    };
}
