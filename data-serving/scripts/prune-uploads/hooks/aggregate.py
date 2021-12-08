# Runs aggregate job after prune-uploads
import os
from typing import Any

import boto3

AWS_REGION = os.getenv("GDH_AGGREGATE_AWS_REGION", "eu-central-1")
# Job definition names are of the form PREFIX-<env>
PREFIX = "gdh-map-aggregation"
JOB_QUEUE = "gdh-map-aggregation"


def run(sources: list[dict[str, Any]], env: str, dry_run: bool = False):
    print("*** Running hook: aggregate ***")
    batch = boto3.client("batch", region_name=AWS_REGION)
    if not sources:
        print("No sources to run hook for, quitting.")
        return
    try:
        jobdefs = set(
            j["jobDefinitionName"]
            for j in batch.describe_job_definitions()["jobDefinitions"]
            if j["jobDefinitionName"].startswith(PREFIX)
        )
    except Exception as e:
        print("Error occurred when fetching job definitions")
        print(e)
        return

    if (jobdef := f"{PREFIX}-{env}") in jobdefs:
        print(f"Submitting aggregation job: {jobdef} ...")
        try:
            if not dry_run:
                batch.submit_job(
                    jobName=jobdef, jobDefinition=jobdef, jobQueue=JOB_QUEUE
                )
                print(f"Successfully submitted job for {jobdef}")
        except Exception as e:
            print(f"Error occurred while trying to submit {jobdef}")
            print(e)
    else:
        print(f"Could not find job definition: {jobdef}")
