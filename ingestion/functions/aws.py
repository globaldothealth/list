#!/usr/bin/env python3
import argparse
from datetime import datetime
from pprint import pprint
import re
import sys
from uuid import uuid4

import boto3

import common.common_lib as common_lib

AWS_REGION = "us-east-1"
AWS_IMAGE = "612888738066.dkr.ecr.us-east-1.amazonaws.com/gdh-ingestor:latest"
AWS_JOB_ROLE_ARN = "arn:aws:iam::612888738066:role/gdh-ingestion-job-role"
AWS_EVENT_ROLE_ARN = "arn:aws:iam::612888738066:role/service-role/AWS_Events_Invoke_Batch_Job_Queue_1312384119"
AWS_JOB_QUEUE_ARN = "arn:aws:batch:us-east-1:612888738066:job-queue/ingestion-queue"
DEFAULT_VCPU = 1
DEFAULT_MEMORY_MIB = 2048
DEFAULT_JOB_QUEUE = "ingestion-queue"
DEFAULT_TIMEOUT_MIN = 60
DEFAULT_SCHEDULE_EXPRESSION = "rate(1 day)"


def get_parser_name_source(source_id, env):
    s3_client = boto3.client("s3", AWS_REGION)
    from retrieval import retrieval

    auth_headers = common_lib.obtain_api_credentials(s3_client)
    try:
        url, source_format, parser, date_filter = retrieval.get_source_details(
            env, source_id, "", auth_headers, None
        )
    except RuntimeError:
        return (False, None)
    parser_module = common_lib.get_parser_module(parser)  # parsing.folder.subfolder
    return (True, parser_module) if parser_module.count(".") == 2 else (True, None)


def job_definition(
    source_name: str, source_id: str, env: str, vcpu: int = DEFAULT_VCPU,
    memory: int = DEFAULT_MEMORY_MIB, timeout: int = DEFAULT_TIMEOUT_MIN
):
    return {
        "jobDefinitionName": f"{source_name}-ingestor-{env}",
        "type": "container",
        "parameters": {},
        "timeout": {
            "attemptDurationSeconds": timeout * 60
        },
        "containerProperties": {
            "image": AWS_IMAGE,
            "vcpus": vcpu,
            "jobRoleArn": AWS_JOB_ROLE_ARN,
            "memory": memory,
            "environment": [
                {"name": "EPID_INGESTION_ENV", "value": env},
                {"name": "EPID_INGESTION_SOURCE_ID", "value": source_id},
            ],
            "ulimits": [],
            "resourceRequirements": [],
        },
    }


class AWSParserManager:
    def __init__(self):

        parser = argparse.ArgumentParser(
            description="Manage AWS Batch and EventBridge rules for ingestion",
            usage="""python aws.py <command> [<options>]

submit        Submit a job using a job definition
compute       List compute environments
jobdefs       List job definitions on Batch
rules         List EventBridge rules
enable        Enable an EventBridge rule
disable       Disable an EventBridge rule
target        Set a Batch job definition as a target for an EventBridge rule
untarget      Remove a Batch job definition as a target for an EventBridge rule
schedule      Create an EventBridge schedule rule
unschedule    Delete an EventBridge schedule rule
parsers       List parsers for which job definitions can be registered
register      Register or update a Batch job definition
deregister    Deregister a Batch job definition
""",
        )

        parser.add_argument("command", help="Subcommand to run")
        args = parser.parse_args(sys.argv[1:2])  # only parse command
        self.batch_client = boto3.client("batch", AWS_REGION)
        self.event_bridge_client = boto3.client("events", AWS_REGION)
        getattr(
            self,
            {"list-compute": "list_compute", "list": "list_jobs"}.get(
                args.command, args.command
            ),
        )()

    def register(self):
        parser = argparse.ArgumentParser(
            prog="aws.py register",
            description="Register a job definition for a source ID and corresponding parsing file",
        )
        parser.add_argument("source_id")
        parser.add_argument("parser", help="Parsing module for the source ID; e.g. example.example")
        parser.add_argument(
            "-e",
            "--env",
            help="Which environment to deploy to",
            choices=["local", "dev", "prod"],
            default="local",
        )
        parser.add_argument(
            "-c",
            "--cpu",
            help="Number of virtual CPUs (default=1)",
            type=int,
            default=DEFAULT_VCPU,
        )
        parser.add_argument(
            "-m",
            "--memory",
            help="Memory allocated to job in MiB (default=2048)",
            type=int,
            default=DEFAULT_MEMORY_MIB,
        )
        parser.add_argument(
            "-t",
            "--timeout",
            help="Maximum time allocated to job in minutes (default=60)",
            type=int,
            default=DEFAULT_TIMEOUT_MIN,
        )

        args = parser.parse_args(sys.argv[2:])
        if args.env == "local":
            print("Can't test local AWS Batch job definition registration")
            return
        print(f"Register {args.source_id} (environment {args.env})")
        success, parser_name = get_parser_name_source(args.source_id, args.env)
        if not success:
            print(
                f"Failed to register {args.source_id} due to error in fetching from curator API"
            )
            sys.exit(1)
        if parser_name:
            print(f"Source {args.source_id} will be parsed by {parser_name}")
            source_name = parser_name.replace(".", "-").replace("parsing-", "")
            print(f"Registering job definition for source {source_name}")
            pprint(
                self.batch_client.register_job_definition(
                    **job_definition(
                        source_name,
                        args.source_id,
                        args.env,
                        args.cpu,
                        args.memory,
                        args.timeout,
                    )
                )
            )
            if "parsing." + args.parser == parser_name:
                print(f"Source {args.source_id} will be parsed by {parser_name}")
            else:
                print(f"Parser {parser_name} for source {args.source_id} in environment {args.env} does not match input {args.parser}")
                sys.exit(1)
        else:
            print(
                f"Missing parser for source {args.source_id} in environment {args.env}\n"
                "Set the parser function in the curator portal, the value\n"
                "should be 'folder.parser' if the parser is at parsing/folder/parser.py"
            )
            sys.exit(1)

    def _job_definitions(self):
        jobs = self.batch_client.describe_job_definitions()
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
            r = self.batch_client.deregister_job_definition(jobDefinition=args.job_definition)
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

    def parsers(self):
        "List available parsers locally"
        for source_id in (m := common_lib.get_source_id_parser_map()):
            for key, val in m[source_id].items():
                print(f"{source_id}  {key}: {val}")
            print()

    def jobdefs(self):
        parser = argparse.ArgumentParser(
            prog="aws.py jobdefs",
            description="List available job definitions which can be used for job submission",
        )
        _ = parser.parse_args(sys.argv[2:])
        success, data = self._job_definitions()
        if not success:
            pprint(data["ResponseMetadata"])
            return
        print("\n".join(f"{j['status']:>8s} {j['jobDefinitionName']}" for j in data))

    def rules(self):
        parser = argparse.ArgumentParser(
            prog="aws.py rules", description="List rules defined in AWS EventBridge"
        )
        parser.add_argument(
            "-d", "--disabled", help="List disabled rules", action="store_true", required=False
        )
        parser.add_argument(
            "-e", "--enabled", help="List enabled rules", action="store_true", required=False
        )
        parser.add_argument(
            "-f", "--filter", help="Filter rule names", type=str, required=False
        )
        parser.add_argument(
            "-t", "--targets", help="Show rule Batch targets", action="store_true", required=False
        )
        parser.add_argument(
            "-v", "--verbose", help="Show all rule information", action="store_true", required=False
        )

        args = parser.parse_args(sys.argv[2:])
        if args.enabled and args.disabled:
            print("Enabled and disabled are mutually exclusive options")
            sys.exit(2)

        rules = self.event_bridge_client.list_rules().get("Rules")
        if not rules:
            print("Could not get EventBridge rules")
            return
        if args.filter:
            rules = [rule for rule in rules if re.match(args.filter, rule.get("Name", ""))]
        if args.enabled:
            rules = [rule for rule in rules if rule.get("State") == "ENABLED"]
        if args.disabled:
            rules = [rule for rule in rules if rule.get("State") == "DISABLED"]
        if args.targets:
            for rule in rules:
                rule_name = rule.get("Name")
                rule["Targets"] = self.get_rule_targets(rule_name)
        if args.verbose:
            pprint(rules)
        else:
            if args.targets:
                rules = [{"Name": rule.get("Name"), "Targets": rule.get("Targets")} for rule in rules]
                pprint(rules)
            else:
                rule_names = [rule.get("Name") for rule in rules]
                print(rule_names)

    def get_rule_targets(self, rule_name):
        batch_targets = {}
        targets = self.event_bridge_client.list_targets_by_rule(Rule=rule_name)
        for target in targets.get("Targets"):
            target_id = target.get("Id")
            if not target_id:
                raise KeyError(f"Could not get target ID for {rule_name}")
            batch_targets[target_id] = target.get("BatchParameters")
        return batch_targets

    def enable(self):
        parser = argparse.ArgumentParser(
            prog="aws.py enable", description="Enable AWS EventBridge rule"
        )
        parser.add_argument(
            "rule_name", help="Name of rule to enable"
        )
        args = parser.parse_args(sys.argv[2:])
        try:
            self.event_bridge_client.enable_rule(Rule=args.rule_name)
        except Exception as exc:
            print(f"An exception occurred while enabling rule {args.rule_name}: {exc}")
            raise
        print("Enabled rule {args.rule_name}")

    def disable(self):
        parser = argparse.ArgumentParser(
            prog="aws.py disable", description="Disable AWS EventBridge rule"
        )
        parser.add_argument(
            "rule_name", help="Name of rule to disable"
        )
        args = parser.parse_args(sys.argv[2:])
        try:
            self.event_bridge_client.disable_rule(Rule=args.rule_name)
        except Exception as exc:
            print(f"An exception occurred while disabling rule {args.rule_name}: {exc}")
            raise
        print("Disabled rule {args.rule_name}")

    def schedule(self):
        parser = argparse.ArgumentParser(
            prog="aws.py schedule", description="Create a new AWS EventBridge schedule rule"
        )
        parser.add_argument(
            "rule_name", help="Name of rule to create"
        )
        parser.add_argument(
            "-t", "--target_name", help="Name of target AWS Batch job description for rule", type=str, required=False
        )
        parser.add_argument(
            "-s", "--source_name", help="Name of data source", type=str, required=False
        )
        parser.add_argument(
            "-j", "--job_name", help="Name of scheduled job", type=str, required=False
        )
        parser.add_argument(
            "-e", "--enabled", help="Enable rule", action="store_true", required=False
        )
        args = parser.parse_args(sys.argv[2:])
        state = "DISABLED"
        description = ""
        if args.enabled:
            state = "ENABLED"
        if args.target_name:
            if not args.source_name:
                print("Data source name required for target creation")
                sys.exit(2)
            if not args.job_name:
                print("Job name required for target creation")
                sys.exit(2)
            description = f"Scheduled Batch ingestion rule for source: {args.source_name}"

        try:
            self.event_bridge_client.put_rule(
                Name=args.rule_name,
                ScheduleExpression=DEFAULT_SCHEDULE_EXPRESSION,
                State=state,
                Description=description
            )
        except Exception as exc:
            print(f"An exception occurred while creating rule {args.rule_name}: {exc}")
            raise
        print(f"Created rule {args.rule_name}")

        if args.target_name:
            target_id = str(uuid4())
            target = [{
                "Id": target_id,
                "Arn": AWS_JOB_QUEUE_ARN,
                "RoleArn": AWS_EVENT_ROLE_ARN,
                "BatchParameters": {
                    "JobDefinition": args.target_name,
                    "JobName": args.job_name
                }
            }]
            try:
                self.event_bridge_client.put_targets(Rule=args.rule_name, Targets=target)
            except Exception as exc:
                print(f"An exception occurred while targeting {args.target_name} for rule {args.rule_name}: {exc}")
                raise
            print(f"Targeted rule {args.rule_name} to {args.target_name}")

    def unschedule(self):
        parser = argparse.ArgumentParser(
            prog="aws.py unschedule", description="Delete rule defined in AWS EventBridge"
        )
        parser.add_argument(
            "rule_name", help="Name of rule to delete"
        )
        args = parser.parse_args(sys.argv[2:])
        try:
            self.event_bridge_client.delete_rule(Name=args.rule_name)
        except Exception as exc:
            print(f"An exception occurred while deleting rule {args.rule_name}: {exc}")
            raise
        print(f"Deleted rule {args.rule_name}")

    def target(self):
        parser = argparse.ArgumentParser(
            prog="aws.py target", description="Create or modify target for rule defined in AWS EventBridge"
        )
        parser.add_argument(
            "rule_name", help="Name of rule"
        )
        parser.add_argument(
            "-t", "--target_name", help="Name of target AWS Batch job description for rule"
        )
        parser.add_argument(
            "-j", "--job_name", help="Name of scheduled job"
        )
        args = parser.parse_args(sys.argv[2:])
        try:
            target_id = str(uuid4())
            target = [{
                "Id": target_id,
                "Arn": AWS_JOB_QUEUE_ARN,
                "RoleArn": AWS_EVENT_ROLE_ARN,
                "BatchParameters": {
                    "JobDefinition": args.target_name,
                    "JobName": args.job_name
                }
            }]
            self.event_bridge_client.put_targets(Rule=args.rule_name, Targets=target)
        except Exception as exc:
            print(f"An exception occurred while setting target for rule {args.rule_name}: {exc}")
            raise
        print(f"Set target {args.target_name} for rule {args.rule_name}")

    def untarget(self):
        parser = argparse.ArgumentParser(
            prog="aws.py untarget", description="Delete targets for rule defined in AWS EventBridge"
        )
        parser.add_argument(
            "rule_name", help="Name of rule with targets to delete"
        )
        args = parser.parse_args(sys.argv[2:])
        target_ids = []
        try:
            self.event_bridge_client.list_targets_by_rule(Rule=args.rule_name)
            targets = self.event_bridge_client.list_targets_by_rule(Rule=args.rule_name)
            for target in targets.get("Targets"):
                target_id = target.get("Id")
                if not target_id:
                    raise KeyError(f"Could not get target ID for rule {args.rule_name}")
                target_ids.append(target_id)
            if len(target_ids) == 0:
                print(f"No targets found for rule {args.rule_name}")
                return
        except Exception as exc:
            print(f"An exception occurred while getting target ids for rule {args.rule_name}: {exc}")
            raise
        try:
            self.event_bridge_client.remove_targets(Rule=args.rule_name, Ids=target_ids)
        except Exception as exc:
            print(f"An exception occurred while deleting targets {target_ids} for rule {args.rule_name}: {exc}")
            raise
        print(f"Deleted targets {target_ids} for rule {args.rule_name}")

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
        parser.add_argument(
            "-t", "--timeout", help="Override job maximum time from job definition", type=int
        )
        parser.add_argument("-s", "--start-date", help="Start date for backfill")
        parser.add_argument("-e", "--end-date", help="End date for backfill")
        args = parser.parse_args(sys.argv[2:])

        if bool(args.start_date) ^ bool(args.end_date):
            print("Specify both start and end date in YYYY-MM-DD format")
            sys.exit(1)

        job_name = args.job_definition + ("-backfill" if args.start_date else "")
        job_submission = {
            "jobName": job_name,
            "jobQueue": args.queue,
            "jobDefinition": args.job_definition
        }
        if args.timeout:
            job_submission["timeout"] = {"attemptDurationSeconds": args.timeout * 60}
        if args.start_date:
            try:
                start = datetime.strptime(args.start_date, "%Y-%m-%d")
                end = datetime.strptime(args.end_date, "%Y-%m-%d")
            except ValueError:
                print("Start and end dates should be in YYYY-MM-DD format")
                sys.exit(1)
            if start > end:
                print(f"Start date {args.start_date} should be before end date {args.end_date}")
                sys.exit(1)
            job_submission["containerOverrides"] = {
                "environment": [
                    {
                        "name": "EPID_INGESTION_PARSING_DATE_RANGE",
                        "value": f"{args.start_date},{args.end_date}"
                    }
                ]
            }

        r = self.batch_client.submit_job(**job_submission)

        if r["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print(f"Submitted job for {args.job_definition} in queue {args.queue}")
            if args.start_date:
                print(f"Backfilling from {args.start_date} to {args.end_date}")
        else:
            print(
                f"Failed submission for {args.job_definition} in queue {args.queue}"
            )
            pprint(r["ResponseMetadata"])

    def list_compute(self):
        print("This functionality is not implemented yet.")


if __name__ == "__main__":
    AWSParserManager()
