import AWS from 'aws-sdk';
import AwsLambdaClient from './aws-lambda-client';
import assertString from '../util/assert-string';

/**
 * Client to interact with the AWS CloudWatch Events API.
 *
 * This class instantiates the connection to AWS on construction. All
 * connection configuration (including mocking) should occur on the AWS object
 * before construction.
 *
 * For examples on using the CloudWatch API, see:
 *   https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/cloudwatch-examples.html
 */
export default class AwsEventsClient {
    private readonly cloudWatchEventsClient: AWS.CloudWatchEvents;
    constructor(
        awsRegion: string,
        private readonly lambdaClient: AwsLambdaClient,
        private readonly serviceEnv: string,
    ) {
        AWS.config.update({ region: awsRegion });
        this.cloudWatchEventsClient = new AWS.CloudWatchEvents({
            apiVersion: '2015-10-07',
        });
    }

    /**
     * Proxies a PutRule request to the AWS CloudWatch API.
     *
     * If Lambda target details are specified, creates a target and applies a
     * permission to the target resource-based policy to allow invocation.
     *
     * For the full API definition, see:
     *   https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_PutRule.html
     */
    putRule = async (
        ruleName: string,
        description: string,
        scheduleExpression?: string,
        targetArn?: string,
        targetId?: string,
        sourceId?: string,
        statementId?: string,
    ): Promise<string> => {
        try {
            const putRuleParams = {
                Name: ruleName,
                ScheduleExpression: scheduleExpression,
                Description: description,
            };
            const response = await this.cloudWatchEventsClient
                .putRule(putRuleParams)
                .promise();
            assertString(
                response.RuleArn,
                'AWS PutRule response missing RuleArn.',
            );
            if (targetArn && targetId && sourceId && statementId) {
                const putTargetsParams = {
                    Rule: ruleName,
                    Targets: [
                        {
                            Arn: targetArn,
                            Id: targetId,
                            Input: JSON.stringify({
                                env: this.serviceEnv,
                                sourceId: sourceId,
                            }),
                        },
                    ],
                };
                await this.cloudWatchEventsClient
                    .putTargets(putTargetsParams)
                    .promise();
                await this.lambdaClient.addInvokeFromEventPermission(
                    response.RuleArn,
                    targetArn,
                    statementId,
                );
            }
            return response.RuleArn;
        } catch (err) {
            console.warn(
                `Unable to create AWS CloudWatch Events rule with:
                name: ${ruleName}
                schedule: ${scheduleExpression}`,
            );
            throw err;
        }
    };

    /**
     * Proxies a DeleteRule request to the AWS CloudWatch API.
     *
     * For the full API definition, see:
     *   https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_DeleteRule.html
     */
    deleteRule = async (
        ruleName: string,
        targetId: string,
        targetArn: string,
        sourceId: string,
    ): Promise<void> => {
        try {
            const removeTargetsParams = {
                Rule: ruleName,
                Ids: [targetId],
            };
            await this.cloudWatchEventsClient
                .removeTargets(removeTargetsParams)
                .promise();
            await this.lambdaClient.removePermission(targetArn, sourceId);
            const deleteRuleParams = { Name: ruleName };
            await this.cloudWatchEventsClient
                .deleteRule(deleteRuleParams)
                .promise();
        } catch (err) {
            console.warn(
                `Unable to delete AWS CloudWatch Events rule with:
                name: ${ruleName}`,
            );
            throw err;
        }
    };
}
