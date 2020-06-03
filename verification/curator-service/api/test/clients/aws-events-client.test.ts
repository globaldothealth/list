import AWS from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';
import AwsEventsClient from '../../src/clients/aws-events-client';

beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
});

afterEach(() => {
    AWSMock.restore('CloudWatchEvents');
});

describe('putRule', () => {
    it('returns created AWS CloudWatch Events rule ARN', async () => {
        const expectedArn = 'expectedArn';
        AWSMock.mock(
            'CloudWatchEvents',
            'putRule',
            (params: any, callback: Function) => {
                callback(null, { RuleArn: expectedArn });
            },
        );
        const client = new AwsEventsClient('us-east-1');

        const ruleArn = await client.putRule(
            'passingRule',
            'description',
            'rate(1 hour)',
        );
        expect(ruleArn).toEqual(expectedArn);
    });
    it('throws errors from AWS', async () => {
        const expectedError = new Error('AWS error');
        AWSMock.mock(
            'CloudWatchEvents',
            'putRule',
            (params: any, callback: Function) => {
                callback(expectedError, null);
            },
        );
        const client = new AwsEventsClient('us-east-1');

        expect.assertions(1);
        return expect(
            client.putRule('awsErrorRule', 'description', 'rate(1 hour)'),
        ).rejects.toThrow(expectedError);
    });
    it('throws error if AWS response somehow lacks RuleArn', async () => {
        AWSMock.mock(
            'CloudWatchEvents',
            'putRule',
            (params: any, callback: Function) => {
                callback(null, {});
            },
        );
        const client = new AwsEventsClient('us-east-1');

        expect.assertions(1);
        return expect(
            client.putRule('noResponseArnRule', 'description', 'rate(1 hour'),
        ).rejects.toThrow('missing RuleArn');
    });
});

describe('deleteRule', () => {
    it('deletes the AWS CloudWatch Event rule via the SDK', async () => {
        const deleteRuleSpy = jest.fn().mockResolvedValueOnce({});
        AWSMock.mock('CloudWatchEvents', 'deleteRule', deleteRuleSpy);
        const client = new AwsEventsClient('us-east-1');

        await expect(client.deleteRule('passingRule')).resolves.not.toThrow();
        expect(deleteRuleSpy).toHaveBeenCalledTimes(1);
    });
    it('throws errors from AWS', async () => {
        const expectedError = new Error('AWS error');
        AWSMock.mock(
            'CloudWatchEvents',
            'deleteRule',
            (params: any, callback: Function) => {
                callback(expectedError, null);
            },
        );
        const client = new AwsEventsClient('us-east-1');

        expect.assertions(1);
        return expect(client.deleteRule('awsErrorRule')).rejects.toThrow(
            expectedError,
        );
    });
});
