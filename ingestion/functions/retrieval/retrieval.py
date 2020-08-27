import json
import os
import sys

import boto3
import google.auth.transport.requests
import requests

from datetime import datetime, timezone

ENV_FIELD = "env"
OUTPUT_BUCKET = "epid-sources-raw"
SOURCE_ID_FIELD = "sourceId"
TIME_FILEPART_FORMAT = "/%Y/%m/%d/%H%M/"

lambda_client = boto3.client("lambda", region_name="us-east-1")
s3_client = boto3.client("s3")

# Layer code, like common_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if ('lambda' not in sys.argv[0]):
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'common'))
import common_lib
from common_lib import UploadError


def extract_event_fields(event):
    print('Extracting fields from event', event)
    if any(
            field not in event
            for field
            in [ENV_FIELD, SOURCE_ID_FIELD]):
        error_message = (
            f"Required fields {ENV_FIELD}; {SOURCE_ID_FIELD} not found in input event json.")
        print(error_message)
        raise ValueError(error_message)
    return event[ENV_FIELD], event[SOURCE_ID_FIELD]


def get_source_details(env, source_id, upload_id, api_headers):
    """
    Retrieves the content URL and format associated with the provided source ID.
    """
    try:
        source_api_endpoint = f"{common_lib.get_source_api_url(env)}/sources/{source_id}"
        print(f"Requesting source configuration from {source_api_endpoint}")
        r = requests.get(source_api_endpoint, headers=api_headers)
        if r and r.status_code == 200:
            api_json = r.json()
            print(f"Received source API response: {api_json}")
            return api_json["origin"]["url"], api_json["format"], api_json.get(
                "automation", {}).get(
                "parser", {}).get(
                "awsLambdaArn", ""), api_json.get(
                'dateFilter', {})
        upload_error = (
            UploadError.SOURCE_CONFIGURATION_NOT_FOUND
            if r.status_code == 404 else UploadError.INTERNAL_ERROR)
        e = RuntimeError(
            f"Error retrieving source details, status={r.status_code}, response={r.text}")
        common_lib.complete_with_error(
            e, env, upload_error, source_id, upload_id,
            api_headers)
    except ValueError as e:
        common_lib.complete_with_error(
            e, env, UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_headers)


def retrieve_content(
        env, source_id, upload_id, url, source_format, api_headers):
    """ Retrieves and locally persists the content at the provided URL. """
    try:
        data = None
        extension = None
        print(f"Downloading {source_format} content from {url}")
        headers = {"user-agent": "GHDSI/1.0 (http://ghdsi.org)"}
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        data = r.content
        if source_format == "JSON":
            extension = "json"
        elif source_format == "CSV":
            extension = "csv"
        else:
            e = ValueError(f"Unsupported source format: {source_format}")
            common_lib.complete_with_error(
                e, env, UploadError.SOURCE_CONFIGURATION_ERROR, source_id,
                upload_id, api_headers)

        key_filename_part = f"content.{extension}"
        with open(f"/tmp/{key_filename_part}", "wb") as f:
            f.write(data)
            s3_object_key = (
                f"{source_id}"
                f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
                f"{key_filename_part}")
            return (f.name, s3_object_key)
    except requests.exceptions.RequestException as e:
        # TODO: Handle 301.
        upload_error = (
            UploadError.SOURCE_CONTENT_NOT_FOUND
            if r.status_code == 404 else
            UploadError.SOURCE_CONTENT_DOWNLOAD_ERROR)
        common_lib.complete_with_error(
            e, env, upload_error, source_id, upload_id,
            api_headers)


def upload_to_s3(
        file_name, s3_object_key, env, source_id, upload_id, api_headers):
    try:
        s3_client.upload_file(
            file_name, OUTPUT_BUCKET, s3_object_key)
        print(
            f"Uploaded source content to s3://{OUTPUT_BUCKET}/{s3_object_key}")
    except Exception as e:
        common_lib.complete_with_error(
            e, env, UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_headers)


def invoke_parser(
    env, parser_arn, source_id, upload_id, api_headers, s3_object_key,
        source_url, date_filter):
    payload = {
        "env": env,
        "s3Bucket": OUTPUT_BUCKET,
        "sourceId": source_id,
        "s3Key": s3_object_key,
        "sourceUrl": source_url,
        "uploadId": upload_id,
        "dateFilter": date_filter,
    }
    print(f"Invoking parser (ARN: {parser_arn})")
    # This is asynchronous due to the "Event" invocation type.
    response = lambda_client.invoke(
        FunctionName=parser_arn,
        InvocationType='Event',
        Payload=json.dumps(payload))
    print(f"Parser response: {response}")
    if "StatusCode" not in response or response["StatusCode"] != 202:
        e = Exception(f"Parser invocation unsuccessful. Response: {response}")
        common_lib.complete_with_error(e, env, UploadError.INTERNAL_ERROR,
                                       source_id, upload_id, api_headers)


def get_today():
    """Return today's datetime, just here for easier mocking."""
    return datetime.today()


def format_source_url(url: str) -> str:
    """
    Formats the given url with the date formatting params contained in it if any.
    Cf. https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes
    """
    return get_today().strftime(url)


def lambda_handler(event, context):
    """Global ingestion retrieval function.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict specified by the CloudWatch Event Rule.
        This must contain a `sourceId` field specifying the canonical epid
        system source UUID.
        For more information, see:
          https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type

    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    JSON object containing the bucket and key at which the retrieved data was
    uploaded to S3. For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    env, source_id = extract_event_fields(event)
    auth_headers = common_lib.obtain_api_credentials(s3_client)
    upload_id = common_lib.create_upload_record(env, source_id, auth_headers)
    url, source_format, parser_arn, date_filter = get_source_details(
        env, source_id, upload_id, auth_headers)
    url = format_source_url(url)
    file_name, s3_object_key = retrieve_content(
        env, source_id, upload_id, url, source_format, auth_headers)
    upload_to_s3(file_name, s3_object_key, env,
                 source_id, upload_id, auth_headers)
    if parser_arn:
        invoke_parser(env, parser_arn, source_id, upload_id,
                      auth_headers, s3_object_key, url, date_filter)
    return {
        "bucket": OUTPUT_BUCKET,
        "key": s3_object_key,
        "upload_id": upload_id,
    }
