import sys
import boto3
import argparse
from pprint import pprint
from datetime import datetime
from common.common_lib import get_source_id_parser_map

AWS_REGION = "us-east-1"
AWS_IMAGE = "612888738066.dkr.ecr.us-east-1.amazonaws.com/gdh-ingestor:latest"
AWS_JOB_ROLE_ARN = "arn:aws:iam::612888738066:role/gdh-ingestion-job-role"
DEFAULT_VCPU = 1
DEFAULT_MEMORY_MIB = 2048
DEFAULT_JOB_QUEUE = "ingestion-queue"


def job_definition(
    source_id: str, env: str, vcpu: int = DEFAULT_VCPU, memory: int = DEFAULT_MEMORY_MIB
):
    return {
        "jobDefinitionName": f"{source_id}-{env}",
        "type": "container",
        "parameters": {},
        "containerProperties": {
            "image": AWS_IMAGE,
            "vcpus": vcpu,
            "jobRoleArn": AWS_JOB_ROLE_ARN,
            "memory": memory,
            "environment": [
                {"name": "EPID_INGESTION_ENV", "value": env},
                {"name": "EPID_INGESTION_SOURCE_ID", "value": source_id},
            ],
            "volumes": [{"host": {"sourcePath": "/mnt/efs"}, "name": "efs"}],
            "mountPoints": [{"containerPath": "/mnt/efs", "sourceVolume": "efs"}],
            "ulimits": [],
            "resourceRequirements": [],
        },
    }


class AWSParserManager:
    def __init__(self):
        self.source_id_parser_map = get_source_id_parser_map()

        parser = argparse.ArgumentParser(
            description="Manage AWS Batch for ingestion",
            usage="""python aws.py <command> [<options>]

deregister      Deregister a Batch job definition
register        Register or update a Batch job definition
list            List parsers for which job definitions can be registered
list-compute    List compute environments
submit          Submit a job using a job definition
""",
        )

        parser.add_argument("command", help="Subcommand to run")
        args = parser.parse_args(sys.argv[1:2])  # only parse command
        self.client = boto3.client("batch", AWS_REGION)
        getattr(
            self,
            {"list-compute": "list_compute", "list": "list_jobs"}.get(
                args.command, args.command
            ),
        )()

    def register(self):
        parser = argparse.ArgumentParser(
            prog="aws.py register",
            description="Register job definitions for a source ID",
        )
        parser.add_argument("source_id")
        parser.add_argument(
            "--env",
            help="Which environment to deploy to",
            choices=["local", "dev", "prod"],
            default="local",
        )
        args = parser.parse_args(sys.argv[2:])
        print(f"Register {args.source_id} (environment {args.env})")
        if args.source_id == "all":
            source_ids = self.source_id_parser_map.keys()
        elif args.source_id in self.source_id_parser_map:
            source_ids = [args.source_id]
        else:
            print(f"Source ID {args.source_id} not found")
            return
        if args.env == "local":
            return
        for source_id in source_ids:
            metadata = self.source_id_parser_map[source_id]
            pprint(
                self.client.register_job_definition(
                    **job_definition(
                        source_id,
                        args.env,
                        metadata.get("vcpu", DEFAULT_VCPU),
                        metadata.get("memory", DEFAULT_MEMORY_MIB),
                    )
                )
            )

    def _job_definitions(self):
        jobs = self.client.describe_job_definitions()
        if jobs["ResponseMetadata"]["HTTPStatusCode"] != 200:
            return (False, jobs["ResponseMetadata"])
        return (True, jobs["jobDefinitions"])

    def _job_definition_names(self):
        success, data = self._job_definitions()
        return [j["jobDefinitionName"] for j in data] if success else None

    def deregister(self):
        parser = argparse.ArgumentParser(
            prog="aws.py deregister", description="Deregister job definition"
        )
        parser.add_argument("job_definition")
        args = parser.parse_args(sys.argv[2:])

        job_definition_names = self._job_definition_names()
        if args.job_definition in job_definition_names:
            r = self.client.deregister_job_definition(jobDefinition=args.job_definition)
            print(
                f"Job definition deregistered: {args.job_definition}"
                if r["ResponseMetadata"]["HTTPStatusCode"] == 200
                else f"Failed to deregister job definition: {args.job_definition}"
            )
        else:
            print(
                f"Job definition not registered: {args.job_definition}\n"
                f"\nCurrent job definitions:\n\n" + "\n".join(job_definition_names)
            )

    def list_jobs(self):
        parser = argparse.ArgumentParser(
            prog="aws.py list",
            description="List available parsers for which jobs can be registered",
        )
        parser.add_argument(
            "-r",
            "--remote",
            help="List current job definitions on AWS",
            action="store_true",
        )

        args = parser.parse_args(sys.argv[2:])
        if args.remote:
            success, data = self._job_definitions()
            if not success:
                pprint(data["ResponseMetadata"])
                return
            print(
                "\n".join(f"{j['status']:>8s} {j['jobDefinitionName']}" for j in data)
            )
            return
        for source_id in self.source_id_parser_map:
            for key, val in self.source_id_parser_map[source_id].items():
                print(f"{source_id}  {key}: {val}")
            print()

    def submit(self):
        parser = argparse.ArgumentParser(
            prog="aws.py submit", description="Submit a job to AWS Batch"
        )
        parser.add_argument(
            "job_definition", help="Job definition to use for submission"
        )
        parser.add_argument(
            "-q", "--queue", help="Which job queue to use", default=DEFAULT_JOB_QUEUE
        )
        args = parser.parse_args(sys.argv[2:])
        job_name = (
            f"{datetime.utcnow().isoformat(timespec='seconds').replace(':', '')}Z"
            f"_{args.job_definition}"
        )
        r = self.client.submit_job(
            jobName=job_name, jobQueue=args.queue, jobDefinition=args.job_definition
        )
        if r["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print(
                f"Submitted {job_name}\n"
                f"Job definition {args.job_definition} in queue {args.queue}"
            )
        else:
            print(f"Failed submission for definition {args.job_definition} in queue {args.queue}")
            pprint(r["ResponseMetadata"])

    def list_compute(self):
        print("This functionality is not implemented yet.")


if __name__ == "__main__":
    AWSParserManager()
