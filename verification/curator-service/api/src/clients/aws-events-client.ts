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
    constructor(awsRegion: string) {
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
        scheduleExpression: string,
    ): Promise<string> => {
        const params = {
            Name: ruleName,
            ScheduleExpression: scheduleExpression,
        };
        try {
            const response = await this.cloudWatchEventsClient
                .putRule(params)
                .promise();
            this.assertString(response.RuleArn);
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
    deleteRule = async (ruleName: string): Promise<void> => {
        try {
            await this.cloudWatchEventsClient
                .deleteRule({ Name: ruleName })
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
