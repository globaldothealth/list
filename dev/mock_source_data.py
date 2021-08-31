from os import environ, path
from pathlib import Path

import boto3
from flask import Flask, request
from flask_api import status


FLASK_HOST = environ.get("FLASK_HOST", "0.0.0.0")
FLASK_PORT = environ.get("FLASK_PORT", 5000)

LOCALSTACK_URL = environ.get("AWS_ENDPOINT", "http://localstack:4566")
BUCKET_NAME = environ.get("RETRIEVAL_BUCKET_NAME", "epid-sources-raw")
S3_BUCKET_URL = f"s3://{BUCKET_NAME}"

SOURCE_DETAILS = {
	"origin": {
		"url": ""
	},
	"format": "",
	"automation": {
		"parser": {
			"awsLambdaArn": "",
		},
	},
	"dateFilter": "",
	"hasStableIdentifiers": False
}

SOURCE_NAMES_TO_PARSERS = {}

SOURCE_IDS_TO_NAMES = {}

UPLOAD_RESPONSE = {
	"_id": "".join("0" for i in range(24))
}

PARSERS_PATH = "/ingestion/functions/parsing"

app = Flask(__name__)


def set_names_to_parsers():
	for path in Path(PARSERS_PATH).iterdir():
		print(f"Checking path {path}")
		if path.is_dir():
			print(f"Path {path} is a directory")
			sample_data_files = list(path.glob("sample_data.*"))
			if len(sample_data_files) == 1:
				name = path.stem.lower()
				# if there are .py files, get the non "test"/"___init__" .py file and remove the extension
				parser_files = [f.stem for f in list(path.glob("*.py")) if "test" not in str(f) and "__init__" not in str(f)]
				if len(parser_files) == 1:
					file_name = parser_files[0]
					parser = f"{path.stem}-{file_name}-ingestor-locale2e"
					SOURCE_NAMES_TO_PARSERS[name] = parser
				else:
					print(f"No single identifiable parser file for source {name}")
			else:
				print(f"No single sample_data file in directory {path}")
	print("Got parsers from file system")


class MockSourceData(object):
	def __init__(self):
		self.s3_client = boto3.client("s3", endpoint_url=LOCALSTACK_URL)
		self.source_details = {}

	def get_sample_data_file(self, source_id):
		source_name = SOURCE_IDS_TO_NAMES.get(source_id)
		if not source_name:
			raise Exception(f"Missing source name for source id {source_id}")

		response = self.s3_client.list_objects(
			Bucket=BUCKET_NAME,
			Prefix=source_name
		)
		objects = response.get("Contents", [])
		if not objects:
			raise Exception(f"No sample data files present for {source_name}")
		obj = objects[0]
		obj_key = obj.get("Key")
		if not obj_key:
			raise Exception(f"No object key present for {source_name}")
		return obj_key

	def make_source_details(self, source_id, file_name):
		source_details = SOURCE_DETAILS.copy()
		ext = path.splitext(file_name)[1]
		source_details["origin"]["url"] = f"s3://{BUCKET_NAME}/{file_name}"
		source_details["format"] = ext.replace(".", "").upper()

		source_name = SOURCE_IDS_TO_NAMES.get(source_id)
		if not source_name:
			raise Exception(f"Missing source name for source id {source_id}")

		source_details["automation"]["parser"]["awsLambdaArn"] = SOURCE_NAMES_TO_PARSERS.get(source_name)

		self.source_details[source_id] = source_details
		return source_details


msd = MockSourceData()


@app.route("/health")
def healthcheck():
	return "OK", status.HTTP_200_OK


@app.route("/sources/<source_id>")
def get_source_details(source_id):
	source_details = msd.source_details.get(source_id)
	if source_details:
		return source_details, status.HTTP_200_OK

	file_name = msd.get_sample_data_file(source_id)
	source_details = msd.make_source_details(source_id, file_name)

	return source_details, status.HTTP_200_OK


@app.route("/sources/<source_id>/uploads", methods=["POST"])
def post_upload(source_id):
	print(f"NOOP on posting upload for source {source_id}")
	return UPLOAD_RESPONSE, status.HTTP_201_CREATED


@app.route("/sources/<source_id>/uploads/<upload_id>", methods=["PUT"])
def put_upload(source_id, upload_id):
	print(f"NOOP on putting upload for source {source_id} and upload {upload_id}")
	return "OK", status.HTTP_200_OK


@app.route("/sources", methods=["POST"])
def map_id_to_name():
	payload = request.get_json()
	source_id = payload.get("source_id")
	source_name = payload.get("source_name")
	if not source_id or not source_name:
		return f"Invalid request. Source ID: {source_id}, source name: {source_name}", status.HTTP_400_BAD_REQUEST
	if SOURCE_IDS_TO_NAMES.get(source_id):
		SOURCE_IDS_TO_NAMES[source_id] = source_name
		return "OK", status.HTTP_200_OK
	SOURCE_IDS_TO_NAMES[source_id] = source_name
	return "OK", status.HTTP_201_CREATED


if __name__ == "__main__":
	set_names_to_parsers()
	app.run(FLASK_HOST, FLASK_PORT, debug=True)
