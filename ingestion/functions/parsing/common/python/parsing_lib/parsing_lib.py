import boto3
import os
import requests
import google.auth.transport.requests
from google.oauth2 import service_account

LOCAL_DATA_FILE = "/tmp/data.json"
METADATA_BUCKET = "epid-ingestion"
SERVICE_ACCOUNT_CRED_FILE = "covid-19-map-277002-0943eeb6776b.json"
SOURCE_URL_FIELD = "sourceUrl"
S3_BUCKET_FIELD = "s3Bucket"
S3_KEY_FIELD = "s3Key"
S3_KEY_PATH_SEPERATOR = "/"

s3_client = boto3.client("s3")


def extract_event_fields(event):
    if any(
            field not in event
            for field in [SOURCE_URL_FIELD, S3_BUCKET_FIELD, S3_KEY_FIELD]):
        error_message = (
            f"Required fields {SOURCE_URL_FIELD}; {S3_BUCKET_FIELD}; "
            f"{S3_KEY_FIELD} not found in input event json.")
        print(error_message)
        raise ValueError(error_message)
    return event[SOURCE_URL_FIELD], event[S3_BUCKET_FIELD], event[S3_KEY_FIELD]


def retrieve_raw_data_file(s3_bucket, s3_key):
    try:
        local_data_file = LOCAL_DATA_FILE
        print(f"Retrieving raw data from s3://{s3_bucket}/{s3_key}")
        s3_client.download_file(s3_bucket, s3_key, local_data_file)
        return local_data_file
    except Exception as e:
        print(e)
        raise e


def write_to_server(cases, headers):
    """
    Upserts the provided cases via the G.h Case API.

    TODO: Link out to the Case API resource documentation, once available.
    """
    put_api_url = f"{os.environ['SOURCE_API_URL']}/cases/batchUpsert"
    print(f"Sending {len(cases)} cases to {put_api_url}")
    res = requests.post(put_api_url, json={"cases": cases},
                       headers=headers)
    res_json = res.json()
    return len(res_json["createdCaseIds"]), len(res_json["updatedCaseIds"])


def obtain_api_credentials():
    """
    Creates HTTP headers credentialed for access to the G.h Source API.
    """
    try:
        local_creds_file = "/tmp/creds.json"
        print(
            "Retrieving service account credentials from "
            f"s3://{METADATA_BUCKET}/{SERVICE_ACCOUNT_CRED_FILE}")
        s3_client.download_file(
            METADATA_BUCKET, SERVICE_ACCOUNT_CRED_FILE, local_creds_file)
        credentials = service_account.Credentials.from_service_account_file(
            local_creds_file, scopes=["email"])
        headers = {}
        request = google.auth.transport.requests.Request()
        credentials.refresh(request)
        credentials.apply(headers)
        return headers
    except Exception as e:
        print(e)
        raise e


def extract_source_id(s3_key):
    """Extracts the source ID based on the canonical object key format."""
    return s3_key.split(S3_KEY_PATH_SEPERATOR, 1)[0]


def run_lambda(event, context, parsing_function):
    """
    Encapsulates all of the work performed by a parsing Lambda.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict.
        This must contain `s3Bucket`, `s3Key`, and `sourceUrl` fields specifying
        the details of the stored source content.

    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    parsing_function: function, required
        Python function that parses raw source data into G.h case data.
        This function must accept (in order): a file containing raw source
        data, a string representing the source UUID, and a string representing
        the source URL. It must return a list of data conforming to the G.h
        case format (TODO: add a link to this definition).
        For an example, see:
          https://github.com/globaldothealth/list/blob/main/ingestion/functions/parsing/india/india.py#L57

    Returns
    ------
    JSON object containing the count of line list cases successfully written to
    G.h servers.
    For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    source_url, s3_bucket, s3_key = extract_event_fields(event)
    raw_data_file = retrieve_raw_data_file(s3_bucket, s3_key)
    case_data = parsing_function(
        raw_data_file, extract_source_id(s3_key),
        source_url)
    api_creds = obtain_api_credentials()
    count_created, count_updated = write_to_server(
        case_data, api_creds)
    return {"count_created": count_created, "count_updated": count_updated}
