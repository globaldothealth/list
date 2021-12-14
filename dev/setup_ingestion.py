import base64
from os import environ, listdir
from pathlib import Path
from random import choice
import re
from string import digits
from sys import exit
from time import sleep

import boto3
from botocore.exceptions import ClientError
import docker
import requests


LOCALSTACK_URL = environ.get("AWS_ENDPOINT", "http://localstack:4566")
AWS_REGION = environ.get("AWS_DEFAULT_REGION", "us-east-1")
AWS_ACCOUNT_ID = environ.get("AWS_ACCOUNT_ID", "000000000000")
AWS_ACCESS_KEY_ID = environ.get("AWS_ACCESS_KEY_ID", "fake")
AWS_SECRET_ACCESS_KEY = environ.get("AWS_SECRET_ACCESS_KEY", "fake")

BATCH_QUEUE_NAME = environ.get("BATCH_QUEUE_NAME", "ingestion-queue")
ECR_REPOSITORY_NAME = environ.get("ECR_REPOSITORY_NAME", "gdh-ingestor")
RETRIEVAL_BUCKET_NAME = environ.get("RETRIEVAL_BUCKET_NAME", "epid-sources-raw")

MOCK_SOURCE_DATA_URL = environ.get("MOCK_SOURCE_DATA_SERVICE", "http://mock-source-data")
MOCK_SOURCE_DATA_PORT = environ.get("MOCK_SOURCE_DATA_PORT", 5001)
MOCK_SOURCE_DATA_ADDRESS = f"{MOCK_SOURCE_DATA_URL}:{MOCK_SOURCE_DATA_PORT}"

REGISTRATION_ENDPOINT = environ.get("REGISTRATION_ENDPOINT", "http://localhost:3001/auth/register")

TESTING = environ.get("TESTING", False)

DOCKERFILE_PATH = "/ingestion/functions"
PARSERS_PATH = "/ingestion/functions/parsing"

CONTAINER_VCPUS = 1
CONTAINER_MEMORY = 2048

CLIENT_EMAIL = environ.get("CLIENT_EMAIL", "fake@fake.fake")

WAIT_TIME = 5
WAIT_RETRIES = 42


def make_source_id():
	return "".join(choice(digits) for i in range(24))


def map_id_to_name(source_id, source_name):
	payload = {"source_id": source_id, "source_name": source_name}
	requests.post(f"{MOCK_SOURCE_DATA_ADDRESS}/sources", json=payload)


class IngestionWrangler(object):

	def __init__(self):
		self.batch_client = boto3.client("batch", endpoint_url=LOCALSTACK_URL)
		self.ecr_client = boto3.client("ecr", endpoint_url=LOCALSTACK_URL)
		self.s3_client = boto3.client("s3", endpoint_url=LOCALSTACK_URL)
		self.docker_client = docker.from_env()
		self.parser_names = []
		self.ecr_username = ""
		self.ecr_password = ""
		self.ecr_repository = ""

	def wait_for_localstack_setup(self):
		print("Waiting for localstack setup to finish")
		counter = 0
		while counter < WAIT_RETRIES:
			containers = self.docker_client.containers.list(
				filters = {
					"exited": 0,
					"name": "setup-localstack_1"
				}
			)
			if containers:
				print("Localstack setup finished")
				return
			counter += 1
			print("Waiting for localstack setup to finish")
			sleep(WAIT_TIME)
		raise Exception(f"Localstack setup did not finish in {WAIT_TIME * WAIT_RETRIES} seconds")

	def set_parser_names(self):
		for path in Path(PARSERS_PATH).iterdir():
			print(f"Checking path {path}")
			if path.is_dir():
				print(f"Path {path} is a directory")
				sample_data_files = list(path.glob("sample_data.*"))
				if len(sample_data_files) == 1:
					# It needs to be lowercased to work with image.build?!
					self.parser_names.append(path.stem.lower())
		print("Got parsers from file system")
		print(f"Parsers: {self.parser_names}")

	def create_parser_images(self):
		for name in self.parser_names:
			self.create_parser_image(name)

	def create_parser_image(self, tag):
		print(f"Creating image with tag {tag}")

		image, _ = self.docker_client.images.build(
			path=DOCKERFILE_PATH,
			tag=tag
		)
		
		print("Created image")

		try:
			success = image.tag(repository=self.ecr_repository, tag=tag)
			if not success:
				print("Could not tag image")
				exit(1)
		except docker.errors.APIError as exc:
			print(f"An error occurred trying to tag the image: {exc}")

		print("Tagged image")

	def set_ecr_config(self):
		token = self.ecr_client.get_authorization_token()
		username, password = base64.b64decode(token["authorizationData"][0]["authorizationToken"]).decode().split(":")
		print(f"ECR username and password: {username} {password}")
		self.ecr_username = username
		self.ecr_password = password
		registry = token["authorizationData"][0]["proxyEndpoint"]
		print(f"Registry: {registry}")
		host = re.sub(r'^https?:\/\/', '', registry)
		self.ecr_repository = f"{host}/{ECR_REPOSITORY_NAME}"

	def login_to_ecr(self):
		print("Logging in to Docker repository")
		
		response = self.docker_client.login(
			username=self.ecr_username,
			password=self.ecr_password,
			registry=self.ecr_repository
		)

		print(f"Response from login: {response}")

		print("Logged in to Docker repository")

	def upload_parser_images(self):
		for name in self.parser_names:
			self.upload_parser_image(name)
		# TODO: remove images from Docker, let Batch pull from ECR

	def upload_parser_image(self, tag):
		print(f"Uploading Docker image with tag {tag} to ECR")
		response = [line for line in self.docker_client.images.push(repository=self.ecr_repository, stream=True)]
		print(f"Response from push: {response}")
		print("Uploaded Docker images")

		print("Checking for images")
		images = self.ecr_client.list_images(
			repositoryName=ECR_REPOSITORY_NAME
		)
		print(f"Images in ECR: {images}")

		image_ids = images.get("imageIds", [])
		image_tags = [image.get("imageTag") for image in image_ids]

		print(f"Image tags in ECR: {image_tags}")

		if tag not in image_tags:
			print(f"Image tagged with {tag} not in ECR")
			exit(1)

		print(f"Image tagged with {tag} in ECR")

	def create_batch_jobs(self):
		for name in self.parser_names:
			source_id = make_source_id()
			map_id_to_name(source_id, name)
			self.create_batch_job(name, source_id)

	def create_batch_job(self, tag, source_id):
		print(f"Creating batch job for {tag}")
		self.batch_client.register_job_definition(
			jobDefinitionName=tag,
			type="container",
			containerProperties={
				"image": f"{AWS_ACCOUNT_ID}.dkr.ecr.{AWS_REGION}.amazonaws.com/{ECR_REPOSITORY_NAME}:{tag}",  # tag?
				"vcpus": CONTAINER_VCPUS,
				"memory": CONTAINER_MEMORY,
				"environment": [
					{"name": "DOCKERIZED", "value": "True"},
					{"name": "EPID_INGESTION_ENV", "value": "locale2e"},
					{"name": "EPID_INGESTION_SOURCE_ID", "value": source_id},
					{"name": "EPID_INGESTION_EMAIL", "value": CLIENT_EMAIL},
					{"name": "AWS_ENDPOINT", "value": "http://localhost:4566"},
					{"name": "AWS_ACCESS_KEY_ID", "value": AWS_ACCESS_KEY_ID},
					{"name": "AWS_SECRET_ACCESS_KEY", "value": AWS_SECRET_ACCESS_KEY},
					{"name": "AWS_REGION", "value": AWS_REGION},
					{"name": "MOCK_SOURCE_DATA_ADDRESS", "value": f"http://localhost:{MOCK_SOURCE_DATA_PORT}"},
					{"name": "REGISTRATION_ENDPOINT", "value": REGISTRATION_ENDPOINT}
				]
			}
		)

	def upload_sample_data(self):
		for path in Path(PARSERS_PATH).iterdir():
			print(f"Checking path {path}")
			if path.is_dir():
				sample_data_files = list(path.glob("sample_data.*"))
				if len(sample_data_files) == 1:
					data_file = sample_data_files[0]
					file_path = str(data_file)
					file_name = data_file.name.lower()
					data_set = path.stem.lower()
					print(f"Uploading sample data file from {file_path}")
					try:
						self.s3_client.upload_file(file_path, RETRIEVAL_BUCKET_NAME, f"{data_set}_{file_name}")
					except ClientError as err:
						print(f"ClientError uploading S3 file: {err}")
						exit(1)
					print("Uploaded sample data file")
		print("Uploaded all sample data files")


if __name__ == "__main__":
	print("Setting up ingestion jobs")
	iw = IngestionWrangler()
	if not TESTING:
		iw.wait_for_localstack_setup()

	iw.set_parser_names()

	iw.set_ecr_config()
	iw.login_to_ecr()

	iw.create_parser_images()
	iw.upload_parser_images()

	iw.upload_sample_data()
	iw.create_batch_jobs()
	print("Done setting up ingestion jobs")
