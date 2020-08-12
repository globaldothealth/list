import datetime
import os
import tempfile

import boto3
import google.auth.transport.requests
import requests
from google.oauth2 import service_account

LOCAL_DATA_FILE = "/tmp/data.json"
METADATA_BUCKET = "epid-ingestion"
SERVICE_ACCOUNT_CRED_FILE = "covid-19-map-277002-0943eeb6776b.json"
SOURCE_URL_FIELD = "sourceUrl"
S3_BUCKET_FIELD = "s3Bucket"
S3_KEY_FIELD = "s3Key"
SOURCE_ID_FIELD = "sourceId"
DATE_FILTER_FIELD = "dateFilter"

s3_client = boto3.client("s3")


def extract_event_fields(event):
    print('Extracting fields from event', event)
    if any(
            field not in event
            for field
            in [SOURCE_URL_FIELD, SOURCE_ID_FIELD, S3_BUCKET_FIELD, S3_KEY_FIELD]):
        error_message = (
            f"Required fields {SOURCE_URL_FIELD}; {S3_BUCKET_FIELD}; "
            f"{SOURCE_ID_FIELD}; {S3_KEY_FIELD} not found in input event json.")
        print(error_message)
        raise ValueError(error_message)
    return event[SOURCE_URL_FIELD], event[SOURCE_ID_FIELD], event[
        S3_BUCKET_FIELD], event[S3_KEY_FIELD], event.get(DATE_FILTER_FIELD, {})


def retrieve_raw_data_file(s3_bucket, s3_key):
    try:
        local_data_file = LOCAL_DATA_FILE
        print(f"Retrieving raw data from s3://{s3_bucket}/{s3_key}")
        s3_client.download_file(s3_bucket, s3_key, local_data_file)
        return local_data_file
    except Exception as e:
        print(e)
        raise e


def create_upload_record(source_id, headers):
    """Creates an upload resource via the G.h Source API."""
    post_api_url = f"{os.environ['SOURCE_API_URL']}/sources/{source_id}/uploads"
    print(f"Creating upload via {post_api_url}")
    res = requests.post(post_api_url,
                        json={"status": "IN_PROGRESS", "summary": {}},
                        headers=headers)
    res_json = res.json()
    if res.status_code != 201:
        raise RuntimeError(
            f'Error creating upload record, status={res.status_code}, response={res_json}')
    # TODO: Look for "errors" in res_json and handle them in some way.
    return res_json["_id"]


def prepare_cases(cases, upload_id):
    """
    Populates standard required fields for the G.h Case API.

    TODO: Migrate source_id/source_url to this method.
    """
    for case in cases:
        case["caseReference"]["uploadId"] = upload_id
    return cases


def write_to_server(cases, headers):
    """Upserts the provided cases via the G.h Case API."""
    put_api_url = f"{os.environ['SOURCE_API_URL']}/cases/batchUpsert"
    print(f"Sending {len(cases)} cases to {put_api_url}")
    res = requests.post(put_api_url, json={"cases": cases},
                        headers=headers)
    res_json = res.json()
    if res.status_code != 200:
        raise RuntimeError(
            f'Error sending cases to server, status={res.status_code}, response={res_json}')
    # TODO: Look for "errors" in res_json and handle them in some way.
    return len(res_json["createdCaseIds"]), len(res_json["updatedCaseIds"])


def finalize_upload(
        source_id, upload_id, count_created, count_updated, headers):
    """Records the results of a successful upload via the G.h Source API."""
    put_api_url = f"{os.environ['SOURCE_API_URL']}/sources/{source_id}/uploads/{upload_id}"
    print(f"Updating upload via {put_api_url}")
    res = requests.put(put_api_url,
                       json={
                           "status": "SUCCESS",
                           "summary": {
                               "numCreated": count_created,
                               "numUpdated": count_updated
                           }},
                       headers=headers)
    res_json = res.json()
    # TODO: Look for "errors" in res_json and handle them in some way.
    if res.status_code != 200:
        raise RuntimeError(
            f'Error updating upload record, status={res.status_code}, response={res_json}')


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


def get_today():
    """Return today's datetime, just here for easier mocking."""
    return datetime.datetime.today()


def filter_cases_by_date(case_data, date_filter):
    """Filter cases according ot the date_filter provided.

    Returns the cases that matched the date filter or all cases if
    no filter was requested.
    """
    if not date_filter:
        return case_data
    now = get_today()
    delta = datetime.timedelta(days=date_filter["numDaysBeforeToday"])
    cutoff_date = now - delta
    op = date_filter["op"]

    def case_is_within_range(case, cutoff_date, op):
        confirmed_event = [e for e in case["events"]
                           if e["name"] == "confirmed"][0]
        case_date = datetime.datetime.strptime(
            confirmed_event["dateRange"]["start"], "%m/%d/%YZ")
        delta_days = (case_date - cutoff_date).days
        if op == "EQ":
            return delta_days == 0
        elif op == "LT":
            return delta_days < 0
        else:
            raise ValueError(f'Unsupported date filter operand: {op}')

    return [case for case in case_data if case_is_within_range(case, cutoff_date, op)]


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

    source_url, source_id, s3_bucket, s3_key, date_filter = extract_event_fields(
        event)
    raw_data_file = retrieve_raw_data_file(s3_bucket, s3_key)
    api_creds = obtain_api_credentials()
    upload_id = create_upload_record(source_id, api_creds)
    case_data = parsing_function(
        raw_data_file, source_id,
        source_url)
    final_cases = prepare_cases(case_data, upload_id)
    count_created, count_updated = write_to_server(
        filter_cases_by_date(final_cases, date_filter), api_creds)
    finalize_upload(source_id, upload_id, count_created,
                    count_updated, api_creds)
    return {"count_created": count_created, "count_updated": count_updated}
