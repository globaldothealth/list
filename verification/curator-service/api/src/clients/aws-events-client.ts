import AWS from 'aws-sdk';

export default class AwsEventsClient {
    private readonly cloudWatchEventsClient: AWS.CloudWatchEvents;
    constructor(awsRegion: string) {
        AWS.config.update({ region: awsRegion });
        this.cloudWatchEventsClient = new AWS.CloudWatchEvents({
            apiVersion: '2015-10-07',
        });
    }

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
        else throw new Error('AWS PutRule response missing RuleArn.');
    }
}
