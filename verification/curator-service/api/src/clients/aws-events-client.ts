import AWS from 'aws-sdk';
import { AssertionError } from 'assert';

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
        private readonly retrievalFunctionArn: string,
        awsRegion: string,
    ) {
        AWS.config.update({ region: awsRegion });
        this.cloudWatchEventsClient = new AWS.CloudWatchEvents({
            apiVersion: '2015-10-07',
        });
    }

    /**
     * Proxies a PutRule request to the AWS CloudWatch API.
     *
     * For the full API definition, see:
     *   https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_PutRule.html
     */
    putRule = async (
        ruleName: string,
        description: string,
        scheduleExpression?: string,
        targetId?: string,
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
            this.assertString(response.RuleArn);
            if (targetId) {
                const putTargetsParams = {
                    Rule: ruleName,
                    Targets: [
                        {
                            Arn: this.retrievalFunctionArn,
                            Id: `${targetId}_Target`,
                            Input: `{ sourceId: "${targetId}"}`,
                        },
                    ],
                };
                await this.cloudWatchEventsClient
                    .putTargets(putTargetsParams)
                    .promise();
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

    private assertString(input: string | undefined): asserts input is string {
        if (typeof input === 'string') return;
        else
            throw new AssertionError({
                message: 'AWS PutRule response missing RuleArn.',
            });
    }

    /**
     * Proxies a DeleteRule request to the AWS CloudWatch API.
     *
     * For the full API definition, see:
     *   https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_DeleteRule.html
     */
    deleteRule = async (ruleName: string, targetId?: string): Promise<void> => {
        try {
            if (targetId) {
                const removeTargetsParams = {
                    Rule: ruleName,
                    Ids: [targetId],
                };
                await this.cloudWatchEventsClient
                    .removeTargets(removeTargetsParams)
                    .promise();
            }
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
