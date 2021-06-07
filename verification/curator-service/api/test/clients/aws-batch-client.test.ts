import AwsBatchClient, {
    BatchJobDefinition,
    RetrievalPayload,
} from '../../src/clients/aws-batch-client';

import AWS from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';

let client: AwsBatchClient;
const submitJobSpy = jest.fn();
const describeJobDefinitionsSpy = jest.fn();

const ingestorName = 'japan-japan-ingestor-test';
const sourceID = 'some-source-id';

const mockJobDefinitions = {
    jobDefinitions: [
        {
            jobDefinitionName: ingestorName,
            containerProperties: {
                environment: [
                    { 
                        name: 'EPID_INGESTION_SOURCE_ID', 
                        value: sourceID
                    },
                    { 
                        name: 'EPID_INGESTION_ENV', 
                        value: 'test'
                    }
                ]
            }
        }
    ]
}


beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
});

beforeEach(() => {
    describeJobDefinitionsSpy.mockClear();
    submitJobSpy.mockClear();
    AWSMock.mock('Batch', 'submitJob', submitJobSpy);
    AWSMock.mock('Batch', 'describeJobDefinitions', describeJobDefinitionsSpy);
    client = new AwsBatchClient('test', 'test-arn', 'us-east-1');
});

afterEach(() => {
    AWSMock.restore('Batch');
});

describe('doRetrieval', () => {
    it('runs retrieval for the given source', async () => {
        const payload: RetrievalPayload = {
            jobName: ingestorName,
        };
        submitJobSpy.mockResolvedValueOnce({
            jobName: ingestorName,
            $metadata: {
                httpStatusCode: 200
            }
        });
        describeJobDefinitionsSpy.mockResolvedValueOnce(mockJobDefinitions);
        const res = await client.doRetrieval(sourceID, {
            start: '2020-09-01',
            end: '2020-09-21',
        });
        expect(submitJobSpy).toHaveBeenCalledTimes(1);
        expect(res).toEqual(payload);
    });
    it('throws when a parser for the input source does not exist', async() => {
        describeJobDefinitionsSpy.mockResolvedValueOnce(mockJobDefinitions);
        const badSourceID = 'not-a-source-id';
        return expect(client.doRetrieval(badSourceID)).rejects.toThrowError(
        );
    });
    it('throws when the aws api returns an error from the describe job definitions call', async () => {
        const expectedError = new Error('AWS error');
        describeJobDefinitionsSpy.mockRejectedValueOnce(expectedError);
        return expect(client.doRetrieval(sourceID)).rejects.toThrow(
            expectedError,
        );
    });
    it('throws when the aws api returns an non-200 from the submit job call', async () => {
        describeJobDefinitionsSpy.mockResolvedValueOnce(mockJobDefinitions);
        const metadata = {httpStatusCode: 400};
        submitJobSpy.mockResolvedValueOnce({
            $metadata: metadata
        });
        return expect(client.doRetrieval(sourceID)).rejects.toThrowError(
        );
    });
});

describe('listParsers', () => {
    it('can be listed', async () => {
        const payload: BatchJobDefinition[] = [
            {
                name: ingestorName,
            },
        ];
        describeJobDefinitionsSpy.mockResolvedValueOnce(mockJobDefinitions);
        const res = await client.listParsers();
        expect(describeJobDefinitionsSpy).toHaveBeenCalledTimes(1);
        expect(res).toEqual(payload);
    });
    it('throws when the aws api returns an error', async () => {
        const expectedError = new Error('AWS error');
        describeJobDefinitionsSpy.mockRejectedValueOnce(expectedError);
        return expect(client.listParsers()).rejects.toThrow(expectedError);
    });
});