import json
import os
import tempfile
import sys
from datetime import datetime, timezone

import boto3
import google.auth.transport.requests
import requests

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


def extract_source_id(event):
    if SOURCE_ID_FIELD not in event:
        error_message = (
            f"Required field {SOURCE_ID_FIELD} not found in input event json.")
        print(error_message)
        raise ValueError(error_message)
    return event[SOURCE_ID_FIELD]


def get_source_details(source_id, api_headers):
    """
    Retrieves the content URL and format associated with the provided source ID.
    """
    try:
        source_api_endpoint = f"{os.environ['SOURCE_API_URL']}/sources/{source_id}"
        print(f"Requesting source configuration from {source_api_endpoint}")
        r = requests.get(source_api_endpoint, headers=api_headers)
        api_json = r.json()
        print(f"Received source API response: {api_json}")
        return api_json["origin"]["url"], api_json["format"], api_json.get("automation", {}).get(
            "parser", {}).get(
            "awsLambdaArn", ""), api_json.get('dateFilter', {})
    except Exception as e:
        print(e)
        raise e


def retrieve_content(source_id, url, source_format):
    """ Retrieves and locally persists the content at the provided URL. """
    try:
        data = None
        extension = None
        print(f"Downloading {source_format} content from {url}")
        headers = {"user-agent": "GHDSI/1.0 (http://ghdsi.org)"}
        r = requests.get(url, headers=headers)
        if source_format == "JSON":
            data = json.dumps(r.json(), indent=4).encode('utf-8')
            extension = "json"
        elif source_format == "CSV":
            data = r.content
            extension = "csv"
        else:
            error_message = f"Unsupported source format: {source_format}"
            print(error_message)
            raise ValueError(error_message)

        key_filename_part = f"content.{extension}"
        with open(f"/tmp/{key_filename_part}", "wb") as f:
            f.write(data)
            s3_object_key = (
                f"{source_id}"
                f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
                f"{key_filename_part}")
            return (f.name, s3_object_key)
    except requests.RequestException as e:
        print(e)
        raise e


def upload_to_s3(file_name, s3_object_key):
    try:
        s3_client.upload_file(
            file_name, OUTPUT_BUCKET, s3_object_key)
        print(
            f"Uploaded source content to s3://{OUTPUT_BUCKET}/{s3_object_key}")
    except Exception as e:
        print(e)
        raise e


def invoke_parser(parser_arn, source_id, s3_object_key, source_url, date_filter):
    payload = {
        "s3Bucket": OUTPUT_BUCKET,
        "sourceId": source_id,
        "s3Key": s3_object_key,
        "sourceUrl": source_url,
        "dateFilter": date_filter,
    }
    print(f"Invoking parser (ARN: {parser_arn}")
    response = lambda_client.invoke(
        FunctionName=parser_arn,
        InvocationType='Event',
        Payload=json.dumps(payload))
    if "StatusCode" not in response or response["StatusCode"] != 202:
        error_message = f"Parser invocation unsuccessful. Response: {response}"
        print(error_message)
        raise Exception(error_message)


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

    source_id = extract_source_id(event)
    auth_headers = common_lib.obtain_api_credentials(s3_client)
    url, source_format, parser_arn, date_filter = get_source_details(
        source_id, auth_headers)
    file_name, s3_object_key = retrieve_content(source_id, url, source_format)
    upload_to_s3(file_name, s3_object_key)
    if parser_arn:
        invoke_parser(parser_arn, source_id, s3_object_key, url, date_filter)
    return {"bucket": OUTPUT_BUCKET, "key": s3_object_key}
