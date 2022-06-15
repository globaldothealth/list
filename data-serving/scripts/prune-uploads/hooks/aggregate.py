# Runs aggregate job after prune-uploads
import logging
import os
from typing import Any

import boto3


AWS_REGION = os.getenv("GDH_AGGREGATE_AWS_REGION", "eu-central-1")
# Job definition names are of the form PREFIX-<env>
PREFIX = os.getenv("JOB_DEF_PREFIX", "gdh-map-aggregation")
JOB_QUEUE = os.getenv("AGG_JOB_QUEUE", "gdh-map-aggregation-fargate")


def run(sources: list[dict[str, Any]], env: str, dry_run: bool = False):
    logging.info("*** Running hook: aggregate ***")
    batch = boto3.client("batch", region_name=AWS_REGION)
    if not sources:
        logging.info("No sources to run hook for, quitting.")
        return
    try:
        jobdefs = set(
            j["jobDefinitionName"]
            for j in batch.describe_job_definitions()["jobDefinitions"]
            if j["jobDefinitionName"].startswith(PREFIX)
        )
    except Exception as e:
        logging.exception("Error occurred when fetching job definitions")
        return

    if (jobdef := f"{PREFIX}-{env}") in jobdefs:
        logging.info(f"Submitting aggregation job: {jobdef} ...")
        try:
            if not dry_run:
                batch.submit_job(
                    jobName=jobdef, jobDefinition=jobdef, jobQueue=JOB_QUEUE
                )
                logging.info(f"Successfully submitted job for {jobdef}")
        except Exception as e:
            logging.exception(f"Error occurred while trying to submit {jobdef}")
    else:
        logging.info(f"Could not find job definition: {jobdef}")
