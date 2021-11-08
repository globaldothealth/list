#!/usr/bin/env python3
import argparse
import base64
from os import environ, listdir
from pathlib import Path
import re
import subprocess
import sys

import boto3
import docker


LOCALSTACK_URL = environ.get("AWS_ENDPOINT", "http://localhost:4566")

AWS_ACCESS_KEY_ID = environ.get("AWS_ACCESS_KEY_ID", "fake")
AWS_SECRET_ACCESS_KEY = environ.get("AWS_SECRET_ACCESS_KEY", "fake")
AWS_DEFAULT_REGION = environ.get("AWS_DEFAULT_REGION","us-east-1")

RETRIEVAL_BUCKET_NAME = environ.get("RETRIEVAL_BUCKET_NAME", "epid-sources-raw")
ECR_REPOSITORY_NAME = environ.get("ECR_REPOSITORY_NAME", "gdh-ingestor")

CONTAINER_VCPUS = 1
CONTAINER_MEMORY = 2048

DOCKERFILE_PATH = "../ingestion/functions"
PARSERS_PATH = "../ingestion/functions/parsing"


class JobRunner(object):

    def __init__(self):
        self.batch_client = boto3.client(
            service_name="batch",
            endpoint_url=LOCALSTACK_URL,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            verify=False
        )
        self.ecr_client = boto3.client(
            service_name="ecr",
            endpoint_url=LOCALSTACK_URL,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            verify=False
        )
        self.s3_client = boto3.client(service_name="s3")
        self.docker_client = docker.from_env()
        self.ecr_repository = ""
        self.set_ecr_config()

        parser = argparse.ArgumentParser(
            description="Get information about AWS Batch job defition(s) or run AWS Batch jobs using job definitions",
            usage="""
                python batch.py <command> [<options>]

                run          Run Batch job with given job definition name(s)
                list         List Batch job definition(s)
                describe     Get detailed information about Batch job definition(s)
                upload       Upload a sample data file for a parser
                build        Build a Docker image for a parser
            """
        )
        parser.add_argument("command", help="Command to run")
        args = parser.parse_args(sys.argv[1:2])
        getattr(self, args.command)()

    def run(self):
        parser = argparse.ArgumentParser(
            prog="run_batch_jobs.py run",
            description="Run Batch job definitions",
        )
        parser.add_argument(
            "job_definition_names", help="Name(s) of job definition(s) to run", nargs="*", default=None
        )
        args = parser.parse_args(sys.argv[2:])
        if args.job_definition_names:
            for name in args.job_definition_names:
                self.run_job(name)
        else:
            self.run_all_jobs()

    def run_all_jobs(self):
        job_definition_names = self.get_job_definition_names()
        print(f"All job definition names")
        errors = []
        for name in job_definition_names:
            try:
                self.run_job(name)
            except Exception as exc:
                print(f"An error occurred while running the {name} job definition: {exc}")
                errors.append(exc)
        print(f"Errors running all jobs: {errors}")

    def get_job_definition_names(self):
        response = self.batch_client.describe_job_definitions()
        job_definitions = response.get("jobDefinitions")
        return [jd.get("jobDefinitionName") for jd in job_definitions]

    def run_job(self, name):

        print(f"Running container for job definition name: {name}")

        # TODO: use self.client.submit_job()
        # blocked by https://github.com/localstack/localstack/issues/4643

        # Get environment variables from Batch for docker-py
        env_vars = self.get_container_env_vars(name)

        # jank but functional since other images get built by local Docker and not removed

        # TODO: port forwarding for HTTP, HTTPS
        logs = self.docker_client.containers.run(
            image=name,
            environment=env_vars,
            network_mode="host"
        )

        print(f"Running job for job definition {name}")

    def get_container_env_vars(self, name):
        response = self.batch_client.describe_job_definitions(
            jobDefinitionName=name
        )
        print(f"Response from Batch {response}")
        job_definitions = response.get("jobDefinitions")
        container_props = job_definitions[0].get("containerProperties", {})
        environment = container_props.get("environment", [{}])
        env_vars = {}
        for kv_pair in environment:
            key = kv_pair.get("name")
            value = kv_pair.get("value")
            env_vars[key] = value
        return env_vars

    def list(self):
        parser = argparse.ArgumentParser(
            prog="run_batch_jobs.py list",
            description="List Batch job definitions",
        )
        parser.add_argument(
            "job_definition_names", help="Name(s) of job definition to check existence of", nargs="*", default=None
        )
        args = parser.parse_args(sys.argv[2:])
        if args.job_definition_names:
            names = []
            for name in args.job_definition_names:
                job_definitions = self.get_job_definitions(name)
                names.append([j.get("jobDefinitionName", "") for j in job_definitions][0])
            print(f"Job definitions: {names}")
        else:
            job_definitions = self.get_job_definitions()
            names = [j.get("jobDefinitionName", "") for j in job_definitions]
            print(f"Job definitions: {names}")

    def get_job_definitions(self, name=None):
        if name:
            jobs = self.batch_client.describe_job_definitions(
                jobDefinitionName=name
            )
        else:
            jobs = self.batch_client.describe_job_definitions()
        if jobs["ResponseMetadata"]["HTTPStatusCode"] != 200:
            raise Exception(f"Could not get Batch job definitions from {LOCALSTACK_URL}")
        return jobs.get("jobDefinitions", [])

    def describe(self):
        parser = argparse.ArgumentParser(
            prog="run_batch_jobs.py describe",
            description="Describe Batch job definitions",
        )
        parser.add_argument(
            "job_definition_names", help="Name(s) of job definition to describe", nargs="*", default=None
        )
        args = parser.parse_args(sys.argv[2:])
        if args.job_definition_names:
            for name in args.job_definition_names:
                response = self.batch_client.describe_job_definitions(
                    jobDefinitionName=name
                )
                print(f"Job definition for parser {name}: {response}")
        else:
            response = self.batch_client.describe_job_definitions()
            print(f"Job definitions: {response}")

    def upload(self):
        parser = argparse.ArgumentParser(
            prog="run_batch_jobs.py upload",
            description="Upload sample_data file for parser",
        )
        parser.add_argument(
            "job_definition_name", help="Name of job definition to upload a sample_data file for", nargs="?", default=None
        )
        args = parser.parse_args(sys.argv[2:])
        if not args.job_definition_name:
            raise Exception("A job definition name is required to upload a sample_data file")
        for path in Path(PARSERS_PATH).iterdir():
            print(f"Checking path {path}")
            if path.is_dir() and path.parts[-1].lower() == args.job_definition_name:
                sample_data_files = list(path.glob("sample_data.*"))
                if len(sample_data_files) == 1:
                    data_file = sample_data_files[0]
                    file_path = str(data_file)
                    file_name = data_file.name.lower()
                    data_set = path.stem.lower()
                    print(f"Uploading sample data file from {file_path}")
                    try:
                        self.s3_client.upload_file(file_path, RETRIEVAL_BUCKET_NAME, f"{data_set}_{file_name}")
                        print(f"Uploaded sample data file for parser {args.job_definition_name}")
                        return
                    except ClientError as err:
                        raise Exception(f"ClientError uploading S3 file: {err}")
                else:
                    raise Exception(f"Could not find exactly one sample_data file for parser {args.job_definition_name}")

        raise Exception(f"Could locate parser {args.job_definition_name}")

    def build(self):
        parser = argparse.ArgumentParser(
            prog="run_batch_jobs.py build",
            description="Build a Docker image for a parser",
        )
        parser.add_argument(
            "job_definition_name", help="Name of job definition build a Docker image for", nargs="?", default=None
        )
        args = parser.parse_args(sys.argv[2:])
        if not args.job_definition_name:
            raise Exception("A job definition name is required to build a Docker image")

        image_name = f"{self.ecr_repository}:{args.job_definition_name}"
        image = self.docker_client.images.get(image_name)
        if not image:
            raise Exception(f"Could not find an existing image for parser {args.job_definition_name}")

        print(f"Creating image with tag {args.job_definition_name}")

        image, _ = self.docker_client.images.build(
            path=DOCKERFILE_PATH,
            tag=args.job_definition_name
        )

        print("Built image")

        try:
            success = image.tag(repository=self.ecr_repository, tag=args.job_definition_name)
            if not success:
                print("Could not tag image")
                exit(1)
        except docker.errors.APIError as exc:
            print(f"An error occurred trying to tag the image: {exc}")

        print(f"Tagged image as {args.job_definition_name}")

    def set_ecr_config(self):
        token = self.ecr_client.get_authorization_token()
        registry = token["authorizationData"][0]["proxyEndpoint"]
        host = re.sub(r'^https?:\/\/', '', registry)
        self.ecr_repository = f"{host}/{ECR_REPOSITORY_NAME}"


if __name__ == "__main__":
    jr = JobRunner()
