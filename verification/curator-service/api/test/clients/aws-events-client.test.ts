import AWS, { AWSError } from 'aws-sdk';

import AWSMock from 'aws-sdk-mock';
import AwsBatchClient from '../../src/clients/aws-batch-client';
import AwsEventsClient from '../../src/clients/aws-events-client';
import validateEnv from '../../src/util/validate-env';

const env = validateEnv();

let client: AwsEventsClient;
const deleteRuleSpy = jest.fn().mockResolvedValueOnce({});
const putRuleSpy = jest.fn().mockResolvedValue({ RuleArn: 'ruleArn' });
const putTargetsSpy = jest.fn().mockResolvedValue({
    FailedEntries: [],
    FailedEntryCount: 0,
});
const removeTargetsSpy = jest.fn().mockResolvedValue({
    FailedEntries: [],
    FailedEntryCount: 0,
});

beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
});

beforeEach(() => {
    deleteRuleSpy.mockClear();
    putRuleSpy.mockClear();
    putTargetsSpy.mockClear();
    removeTargetsSpy.mockClear();
    AWSMock.mock('CloudWatchEvents', 'deleteRule', deleteRuleSpy);
    AWSMock.mock('CloudWatchEvents', 'putRule', putRuleSpy);
    AWSMock.mock('CloudWatchEvents', 'putTargets', putTargetsSpy);
    AWSMock.mock('CloudWatchEvents', 'removeTargets', removeTargetsSpy);
    client = new AwsEventsClient(
        env.SERVICE_ENV,
        env.LOCALSTACK_URL,
        'us-east-1',
        new AwsBatchClient(env.SERVICE_ENV, env.LOCALSTACK_URL, 'test-arn', 'us-east-1'),
        'test-arn',
    );
});

afterEach(() => {
    AWSMock.restore('CloudWatchEvents');
});

describe('putRule', () => {
    it('returns subject AWS CloudWatch Events rule ARN', async () => {
        const expectedArn = 'expectedArn';
        putRuleSpy.mockResolvedValueOnce({ RuleArn: expectedArn });

        const ruleArn = await client.putRule(
            'passingRule',
            'description',
            'rate(1 hour)',
        );
        expect(ruleArn).toEqual(expectedArn);
        expect(putRuleSpy).toHaveBeenCalledTimes(1);
    });
    it('creates a permissioned target for the rule if targetId and sourceId provided', async () => {
        const ruleName = 'passingRule';
        const targetArn = 'targetArn';
        const targetId = 'targetId';
        const sourceId = 'sourceId';
        await client.putRule(
            ruleName,
            'description',
            'rate(1 hour)',
            targetArn,
            targetId,
            sourceId,
            'statementId',
        );
        expect(putTargetsSpy).toHaveBeenCalledTimes(1);
        expect(putTargetsSpy).toHaveBeenCalledWith(
            {
                Rule: ruleName,
                Targets: [
                    {
                        Arn: client.batchClient.jobQueueArn,
                        Id: targetId,
                        RoleArn: client.eventRoleArn,
                        BatchParameters: {
                                JobDefinition: targetArn,
                                JobName: ruleName,
                        },
                    },
                ],
            },
            // There's a callback function added under-the-hood by aws-sdk.
            expect.anything(),
        );
    });
    it('does not mutate rule targets if target details not provided', async () => {
        await client.putRule('passingRule', 'description', 'rate(1 hour)');
        expect(putTargetsSpy).not.toHaveBeenCalled();
    });
    it('throws errors from AWS putRule call', async () => {
        const expectedError = new Error('AWS error');
        putRuleSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.putRule('awsErrorRule', 'description', 'rate(1 hour)'),
        ).rejects.toThrow(expectedError);
    });
    it('throws errors from AWS putTargets call', async () => {
        const expectedError = new Error('AWS error');
        putTargetsSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.putRule(
                'ruleName',
                'description',
                'rate(1 hour)',
                'targetArn',
                'awsErrorTargetId',
                'sourceId',
                'statementId',
            ),
        ).rejects.toThrow(expectedError);
    });
    it('throws error if PutRuleResponse somehow lacks RuleArn', async () => {
        putRuleSpy.mockResolvedValueOnce({});

        return expect(
            client.putRule('noResponseArnRule', 'description', 'rate(1 hour'),
        ).rejects.toThrow('missing RuleArn');
    });
});

describe('deleteRule', () => {
    it('deletes the AWS CloudWatch Event rule, target, and permission via the SDK', async () => {
        await expect(
            client.deleteRule(
                'passingRuleName',
                'targetId',
                'targetArn',
                'sourceId',
            ),
        ).resolves.not.toThrow();
        expect(deleteRuleSpy).toHaveBeenCalledTimes(1);
        expect(removeTargetsSpy).toHaveBeenCalledTimes(1);
    });
    it('throws errors from AWS removeTargets call', async () => {
        const expectedError = new Error('AWS error');
        removeTargetsSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.deleteRule(
                'awsErrorRuleName',
                'targetId',
                'targetArn',
                'sourceId',
            ),
        ).rejects.toThrow(expectedError);
    });
    it('throws errors from AWS deleteRule call', async () => {
        const expectedError = new Error('AWS error');
        deleteRuleSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.deleteRule(
                'awsErrorRuleName',
                'targetId',
                'targetArn',
                'sourceId',
            ),
        ).rejects.toThrow(expectedError);
    });
});
