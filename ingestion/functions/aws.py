import sys
import boto3
import argparse
from common.common_lib import get_source_id_parser_map

AWS_REGION = "us-east-1"
AWS_IMAGE = "612888738066.dkr.ecr.us-east-1.amazonaws.com/gdh-ingestor:latest"
AWS_JOB_ROLE_ARN = "arn:aws:iam::612888738066:role/gdh-ingestion-job-role"


def job_definition(source_id: str, env: str, vcpu: int = 1, memory: int = 2048):
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
            usage="""python aws.py <command> [--region=<region>]

register\tRegister or update a Batch job definition
list\t\tList parsers for which job definitions can be registered
deregister\tDeregister a Batch job definition
list-compute\tList compute environments
""",
        )

        parser.add_argument("command", help="Subcommand to run")
        parser.add_argument("--region", help="AWS region", default=AWS_REGION)
        args = parser.parse_args(sys.argv[1:2])  # only parse command
        self.client = boto3.client("batch", args.region)
        getattr(
            self,
            {"list-compute": "list_compute", "list": "list_jobs"}.get(
                args.command, args.command
            ),
        )()

    def register(self):
        parser = argparse.ArgumentParser(
            description="Register job definitions for a source ID"
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
        if args.env == "local":
            print("Registration succeeded (this is always true for --env=local)")

    def deregister(self):
        parser = argparse.ArgumentParser(
            description="Deregister job definitions for a source ID"
        )
        parser.add_argument("source_id")
        args = parser.parse_args(sys.argv[2:])
        print(f"Deregister {args.source_id} (environment {args.env})")

    def list_jobs(self):
        parser = argparse.ArgumentParser(
            description="List available parsers for which jobs can be registered"
        )
        parser.add_argument(
            "-r",
            "--remote",
            help="List current job definitions on AWS",
            action="store_true",
        )

        args = parser.parse_args(sys.argv[2:])
        if args.remote:
            print(
                "Listing current job definitions on AWS\n"
                "This functionality is not implemented yet."
            )
            return
        for source_id in self.source_id_parser_map:
            for key, val in self.source_id_parser_map[source_id].items():
                print(f"{source_id}  {key}: {val}")
            print()

    def list_compute(self):
        print("This functionality is not implemented yet.")


if __name__ == "__main__":
    AWSParserManager()
