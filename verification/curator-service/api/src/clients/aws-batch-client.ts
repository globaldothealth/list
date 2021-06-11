import {
    JobDefinition,
} from 'aws-sdk/clients/batch';

import AWS from 'aws-sdk';
import assertString from '../util/assert-string';
import { logger } from '../util/logger';


export interface BatchJobDefinition {
    name: string;
}

export interface RetrievalPayload {
    jobName: string;
}

/**
 * Defines the time period over which Batch jobs should parse/ingest data.
 *
 * Note that start and end are YYYY-MM-DD format strings.
 */
export interface ParseDateRange {
    start: string;
    end: string;
}

/**
 * Client to interact with the AWS Batch API.
 *
 * This class instantiates the connection to AWS on construction. All
 * connection configuration (including mocking) should occur on the AWS object
 * before construction.
 */
export default class AwsBatchClient {
    private readonly batchClient: AWS.Batch;
    constructor(
        private readonly serviceEnv: string,
        readonly jobQueueArn: string,
        awsRegion: string,
    ) {
        AWS.config.update({ region: awsRegion });
        this.batchClient = new AWS.Batch({
            apiVersion: '2016-08-10',
        });
    }

    /**
     * Submit retrieval batch job synchronously, returning its output.
     *
     * @param sourceId - ID of the source to be retrieved.
     * @param parseDateRange - Range over which to perform parsing (inclusive).
     */
    doRetrieval = async (
        sourceId: string,
        parseDateRange?: ParseDateRange,
    ): Promise<RetrievalPayload> => {
        try {
        	const r = await this.batchClient
                .describeJobDefinitions({ maxResults: 10000 })
                .promise();

            let jobName;
            jobDefsLoop:
	          	for (var jd of r.jobDefinitions || []) {
                    if (jd.containerProperties){
                        if (jd.containerProperties.environment) {
                            for (var env_var of jd.containerProperties.environment) {
                                if (env_var.name == 'EPID_INGESTION_SOURCE_ID' && env_var.value == sourceId) {
                                    jobName = jd.jobDefinitionName;
                                    break jobDefsLoop;
                                }
                            }
                        }
                    }
	          	}

	        if (!jobName) {
	        	throw Error(
	        		`Could not find jobDefinition for sourceId ${sourceId}`
	        	);
	        }

            const res = await this.batchClient
        		.submitJob({
        			jobDefinition: jobName,
        			jobName: jobName,
        			jobQueue: this.jobQueueArn,
        			containerOverrides: parseDateRange
            			? {
            				environment: [
            					{
            						name: 'EPID_INGESTION_PARSING_DATE_RANGE',
            						value: parseDateRange.start.concat(',', parseDateRange.end)
            					}
            				]
            			  }
            			: undefined
        		})
                .promise();
            if (!res.jobId) {
            	logger.error(res);
            	throw Error(
                    `Retrieving source "${sourceId}" content: ${res}`,
                );
            }
            let ret = {jobName: res.jobName};
            return ret;
        } catch (e) {
            logger.error(e);
            throw e;
        }
    };

    /** Lists the available parsers */
    listParsers = async (): Promise<BatchJobDefinition[]> => {
        try {
            const res = await this.batchClient
                .describeJobDefinitions({ maxResults: 10000 })
                .promise();
            return (
                res.jobDefinitions?.filter((j) =>
                    j.jobDefinitionName?.includes('ingestor'),
                )?.map<BatchJobDefinition>((j) => {
                    return { name: j.jobDefinitionName || '' };
                }) || []
            );
        } catch (e) {
            logger.error(e);
            throw e;
        }
    };

}