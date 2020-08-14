import json
import os
import tempfile
from datetime import datetime, timezone
from enum import Enum

import boto3
import google.auth.transport.requests
import requests
from google.oauth2 import service_account

METADATA_BUCKET = "epid-ingestion"
OUTPUT_BUCKET = "epid-sources-raw"
SERVICE_ACCOUNT_CRED_FILE = "covid-19-map-277002-0943eeb6776b.json"
SOURCE_ID_FIELD = "sourceId"
TIME_FILEPART_FORMAT = "/%Y/%m/%d/%H%M/"

lambda_client = boto3.client("lambda", region_name="us-east-1")
s3_client = boto3.client("s3")


# TODO: Move this into common_lib.py after that's merged.
class UploadError(Enum):
    """
    Upload error categories corresponding to the G.h Source API.

    TODO: Move upload handling logic to common_lib.
    """
    INTERNAL_ERROR = 1
    SOURCE_CONFIGURATION_ERROR = 2
    SOURCE_CONFIGURATION_NOT_FOUND = 3
    SOURCE_CONTENT_NOT_FOUND = 4
    SOURCE_CONTENT_DOWNLOAD_ERROR = 5
    PARSING_ERROR = 6
    DATA_UPLOAD_ERROR = 7


# TODO: Move this into common_lib.py after that's merged.
def create_upload_record(source_id, headers):
    """Creates an upload resource via the G.h Source API."""
    post_api_url = f"{os.environ['SOURCE_API_URL']}/sources/{source_id}/uploads"
    print(f"Creating upload via {post_api_url}")
    res = requests.post(post_api_url,
                        json={"status": "IN_PROGRESS", "summary": {}},
                        headers=headers)
    if res and res.status_code == 201:
        res_json = res.json()
        # TODO: Look for "errors" in res_json and handle them in some way.
        return res_json["_id"]
    e = RuntimeError(
        f'Error creating upload record, status={res.status_code}, response={res.text}')
    complete_with_error(e)


# TODO: Move this into common_lib.py after that's merged.
def finalize_upload(
        source_id, upload_id, headers, count_created=None, count_updated=None,
        error=None):
    """Records the results of an upload via the G.h Source API."""
    put_api_url = f"{os.environ['SOURCE_API_URL']}/sources/{source_id}/uploads/{upload_id}"
    print(f"Updating upload via {put_api_url}")
    update = {
        "status": "ERROR", "summary": {"error": error.name}} if error else {
        "status": "SUCCESS",
        "summary": {"numCreated": count_created, "numUpdated": count_updated}}
    res = requests.put(put_api_url,
                       json=update,
                       headers=headers)
    # TODO: Look for "errors" in res_json and handle them in some way.
    if not res or res.status_code != 200:
        e = RuntimeError(
            f'Error updating upload record, status={res.status_code}, response={res.text}')
        complete_with_error(e, UploadError.INTERNAL_ERROR,
                            source_id, upload_id, headers)


# TODO: Move this into common_lib.py after that's merged.
def complete_with_error(
        exception, upload_error=None, source_id=None, upload_id=None,
        headers=None):
    """
    Logs and raises the provided exception.

    If upload details are provided, updates the indicated upload with the
    provided data.
    """
    print(exception)
    if upload_error and source_id and upload_id:
        finalize_upload(source_id, upload_id, headers,
                        error=upload_error)
    raise exception


def extract_source_id(event):
    if SOURCE_ID_FIELD not in event:
        error_message = (
            f"Required field {SOURCE_ID_FIELD} not found in input event json.")
        print(error_message)
        raise ValueError(error_message)
    return event[SOURCE_ID_FIELD]


def obtain_api_credentials():
    """
    Creates HTTP headers credentialed for access to the Global Health Source API.
    """
    try:
        with tempfile.NamedTemporaryFile() as local_creds_file:
            print(
                "Retrieving service account credentials from "
                f"s3://{METADATA_BUCKET}/{SERVICE_ACCOUNT_CRED_FILE}")
            s3_client.download_file(
                METADATA_BUCKET, SERVICE_ACCOUNT_CRED_FILE, local_creds_file.name)
            credentials = service_account.Credentials.from_service_account_file(
                local_creds_file.name, scopes=["email"])
            headers = {}
            request = google.auth.transport.requests.Request()
            credentials.refresh(request)
            credentials.apply(headers)
            return headers
    except Exception as e:
        print(e)
        raise e


def get_source_details(source_id, upload_id, api_headers):
    """
    Retrieves the content URL and format associated with the provided source ID.
    """
    try:
        source_api_endpoint = f"{os.environ['SOURCE_API_URL']}/sources/{source_id}"
        print(f"Requesting source configuration from {source_api_endpoint}")
        r = requests.get(source_api_endpoint, headers=api_headers)
        api_json = r.json()
        print(f"Received source API response: {api_json}")
        return api_json["origin"]["url"], api_json["format"], api_json.get(
            "automation", {}).get(
            "parser", {}).get(
            "awsLambdaArn", ""), api_json.get(
            'dateFilter', {})
    except Exception as e:
        upload_error = (
            UploadError.SOURCE_CONFIGURATION_NOT_FOUND
            if r.status_code == 404 else UploadError.INTERNAL_ERROR)
        complete_with_error(
            e, upload_error, source_id, upload_id,
            api_headers)


def retrieve_content(source_id, upload_id, url, source_format, api_headers):
    """ Retrieves and locally persists the content at the provided URL. """
    try:
        data = None
        extension = None
        print(f"Downloading {source_format} content from {url}")
        headers = {"user-agent": "GHDSI/1.0 (http://ghdsi.org)"}
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        if source_format == "JSON":
            data = json.dumps(r.json(), indent=4).encode('utf-8')
            extension = "json"
        elif source_format == "CSV":
            data = r.content
            extension = "csv"
        else:
            e = ValueError(f"Unsupported source format: {source_format}")
            complete_with_error(
                e, UploadError.SOURCE_CONFIGURATION_ERROR, source_id, upload_id,
                api_headers)

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
        complete_with_error(
            e, upload_error, source_id, upload_id,
            api_headers)


def upload_to_s3(file_name, s3_object_key, source_id, upload_id, api_headers):
    try:
        s3_client.upload_file(
            file_name, OUTPUT_BUCKET, s3_object_key)
        print(
            f"Uploaded source content to s3://{OUTPUT_BUCKET}/{s3_object_key}")
    except Exception as e:
        complete_with_error(
            e, UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_headers)


def invoke_parser(
    parser_arn, source_id, upload_id, api_headers, s3_object_key,
        source_url, date_filter):
    payload = {
        "s3Bucket": OUTPUT_BUCKET,
        "sourceId": source_id,
        "s3Key": s3_object_key,
        "sourceUrl": source_url,
        "uploadId": upload_id,
        "dateFilter": date_filter,
    }
    print(f"Invoking parser (ARN: {parser_arn}")
    response = lambda_client.invoke(
        FunctionName=parser_arn,
        InvocationType='Event',
        Payload=json.dumps(payload))
    if "StatusCode" not in response or response["StatusCode"] != 202:
        e = Exception(f"Parser invocation unsuccessful. Response: {response}")
        complete_with_error(e, UploadError.INTERNAL_ERROR,
                            source_id, upload_id, api_headers)


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
    auth_headers = obtain_api_credentials()
    upload_id = create_upload_record(source_id, auth_headers)
    url, source_format, parser_arn, date_filter = get_source_details(
        source_id, upload_id, auth_headers)
    file_name, s3_object_key = retrieve_content(
        source_id, upload_id, url, source_format, auth_headers)
    upload_to_s3(file_name, s3_object_key, source_id, upload_id, auth_headers)
    if parser_arn:
        invoke_parser(parser_arn, source_id, upload_id,
                      auth_headers, s3_object_key, url, date_filter)
    return {"bucket": OUTPUT_BUCKET, "key": s3_object_key}
