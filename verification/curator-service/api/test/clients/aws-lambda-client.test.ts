import AWS from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';
import AwsLambdaClient, {
    RetrievalPayload,
} from '../../src/clients/aws-lambda-client';

let client: AwsLambdaClient;
const addPermissionSpy = jest
    .fn()
    .mockResolvedValue({ Statement: 'statement' });
const removePermissionSpy = jest.fn().mockResolvedValue({});
const invokeSpy = jest.fn();

beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
});

beforeEach(() => {
    addPermissionSpy.mockClear();
    removePermissionSpy.mockClear();
    invokeSpy.mockClear();
    AWSMock.mock('Lambda', 'addPermission', addPermissionSpy);
    AWSMock.mock('Lambda', 'removePermission', removePermissionSpy);
    AWSMock.mock('Lambda', 'invoke', invokeSpy);
    client = new AwsLambdaClient('some-arn', 'test', 'us-east-1');
});

afterEach(() => {
    AWSMock.restore('Lambda');
});

describe('addInvokeFromEventPermission', () => {
    it('returns permission statement from AWS', async () => {
        const expectedStatement = 'expectedStatement';
        addPermissionSpy.mockResolvedValueOnce({
            Statement: expectedStatement,
        });

        const result = await client.addInvokeFromEventPermission(
            'sourceArn',
            'functionArn',
            'statementId',
        );

        expect(result).toEqual(expectedStatement);
        expect(addPermissionSpy).toHaveBeenCalledTimes(1);
    });
    it('throws errors from AWS addPermission call', async () => {
        const expectedError = new Error('AWS error');
        addPermissionSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.addInvokeFromEventPermission(
                'sourceArn',
                'functionArn',
                'statementId',
            ),
        ).rejects.toThrow(expectedError);
    });
    it('throws error if AddPermissionResponse somehow lacks Statement', async () => {
        addPermissionSpy.mockResolvedValueOnce({});

        return expect(
            client.addInvokeFromEventPermission(
                'sourceArn',
                'functionArn',
                'statementId',
            ),
        ).rejects.toThrow('missing Statement');
    });
});

describe('removePermission', () => {
    it('deletes the permission via the SDK', async () => {
        await expect(
            client.removePermission('functionName', 'statementId'),
        ).resolves.not.toThrow();
        expect(removePermissionSpy).toHaveBeenCalledTimes(1);
    });
    it('throws errors from AWS removePermission call', async () => {
        const expectedError = new Error('AWS error');
        removePermissionSpy.mockRejectedValueOnce(expectedError);

        return expect(
            client.removePermission('functionName', 'statementId'),
        ).rejects.toThrow(expectedError);
    });
});

describe('invokeRetrieval', () => {
    it('invoke retrieval for the given source', async () => {
        const payload: RetrievalPayload = {
            key: 'some key',
            bucket: 'some bucket',
            upload_id: 'foo',
        };
        invokeSpy.mockResolvedValueOnce({
            Payload: JSON.stringify(payload),
        });
        const res = await client.invokeRetrieval('some-source-id');
        expect(invokeSpy).toHaveBeenCalledTimes(1);
        expect(res).toEqual(payload);
    });
    it('throws when error is returned by aws api', async () => {
        const expectedError = new Error('AWS error');
        invokeSpy.mockRejectedValueOnce(expectedError);
        return expect(client.invokeRetrieval('some-source-id')).rejects.toThrow(
            expectedError,
        );
    });
    it('throws when function is not run properly', async () => {
        invokeSpy.mockResolvedValueOnce({
            FunctionError: 'Func error',
        });
        return expect(client.invokeRetrieval('some-source-id')).rejects.toThrow(
            /Func error/,
        );
    });
});
