import AWS from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';
import AwsLambdaClient from '../../src/clients/aws-lambda-client';

let client: AwsLambdaClient;
const addPermissionSpy = jest
    .fn()
    .mockResolvedValue({ Statement: 'statement' });

beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
});

beforeEach(() => {
    addPermissionSpy.mockClear();
    AWSMock.mock('Lambda', 'addPermission', addPermissionSpy);
    client = new AwsLambdaClient('us-east-1');
});

afterEach(() => {
    AWSMock.restore('Lambda');
});

describe('addPermission', () => {
    it('returns permission statement from AWS', async () => {
        const expectedStatement = 'expectedStatement';
        addPermissionSpy.mockResolvedValueOnce({
            Statement: expectedStatement,
        });

        const result = await client.addPermission(
            'action',
            'sourceArn',
            'functionArn',
            'principal',
            'statementId',
        );

        expect(result).toEqual(expectedStatement);
        expect(addPermissionSpy).toHaveBeenCalledTimes(1);
    });

    it('throws errors from AWS addPermission call', async () => {
        const expectedError = new Error('AWS error');
        addPermissionSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.addPermission(
                'action',
                'sourceArn',
                'functionArn',
                'principal',
                'statementId',
            ),
        ).rejects.toThrow(expectedError);
    });
    it('throws error if AddPermissionResponse somehow lacks Statement', async () => {
        addPermissionSpy.mockResolvedValueOnce({});

        return expect(
            client.addPermission(
                'action',
                'sourceArn',
                'functionArn',
                'principal',
                'statementId',
            ),
        ).rejects.toThrow('missing Statement');
    });
});
