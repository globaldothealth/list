import AWS from 'aws-sdk';
import AwsBatchClient from './aws-batch-client';
import assertString from '../util/assert-string';
import { logger } from '../util/logger';


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
        private readonly serviceEnv: string,
        private readonly localstackURL: string,
        awsRegion: string,
        readonly batchClient: AwsBatchClient,
        readonly eventRoleArn: string,
    ) {
        AWS.config.update({ region: awsRegion });
        if (serviceEnv == 'locale2e') {
            this.cloudWatchEventsClient = new AWS.CloudWatchEvents({
                apiVersion: '2015-10-07',
                endpoint: localstackURL,
            });
        }
        else {
            this.cloudWatchEventsClient = new AWS.CloudWatchEvents({
                apiVersion: '2015-10-07',
            });
        }
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
        targetArn?: string,
        targetId?: string,
        sourceId?: string,
        statementId?: string
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
                            Arn: this.batchClient.jobQueueArn,
                            Id: targetId,
                            RoleArn: this.eventRoleArn,
                            BatchParameters: {
                                JobDefinition: targetArn,
                                JobName: ruleName,
                            },
                        }
                    ]
                };
                await this.cloudWatchEventsClient
                    .putTargets(putTargetsParams)
                    .promise();
            }
            return response.RuleArn;
        } catch (err) {
            logger.warn(
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
        sourceId: string
    ): Promise<void> => {
        try {
            const removeTargetsParams = {
                Rule: ruleName,
                Ids: [targetId],
            };
            await this.cloudWatchEventsClient
                .removeTargets(removeTargetsParams)
                .promise();
            const deleteRuleParams = { Name: ruleName };
            await this.cloudWatchEventsClient
                .deleteRule(deleteRuleParams)
                .promise();
        } catch (err) {
            logger.warn(
                `Unable to delete AWS CloudWatch Events rule with:
                name: ${ruleName}`,
            );
            throw err;
        }
    };
}
