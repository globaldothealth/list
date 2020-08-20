import datetime
import os
import sys
import tempfile

import boto3
import google.auth.transport.requests
import requests

from enum import Enum
from google.oauth2 import service_account

# TODO: Use tempfile here instead.
LOCAL_DATA_FILE = "/tmp/rawdata"
SOURCE_URL_FIELD = "sourceUrl"
S3_BUCKET_FIELD = "s3Bucket"
S3_KEY_FIELD = "s3Key"
SOURCE_ID_FIELD = "sourceId"
UPLOAD_ID_FIELD = "uploadId"
DATE_FILTER_FIELD = "dateFilter"
UNVERIFIED_STATUS = "UNVERIFIED"

s3_client = boto3.client("s3")

# Layer code, like common_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if ('lambda' not in sys.argv[0]):
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,
            os.pardir,
            os.pardir,
            os.pardir,
            'common'))
import common_lib


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
    VALIDATION_ERROR = 8


def extract_event_fields(event):
    print('Extracting fields from event', event)
    if any(
            field not in event
            for field
            in [SOURCE_URL_FIELD, SOURCE_ID_FIELD, S3_BUCKET_FIELD, S3_KEY_FIELD]):
        error_message = (
            f"Required fields {SOURCE_URL_FIELD}; {S3_BUCKET_FIELD}; "
            f"{SOURCE_ID_FIELD}; {S3_KEY_FIELD} not found in input event json.")
        e = ValueError(error_message)
        complete_with_error(e)
    return event[SOURCE_URL_FIELD], event[SOURCE_ID_FIELD], event.get(UPLOAD_ID_FIELD), event[
        S3_BUCKET_FIELD], event[S3_KEY_FIELD], event.get(DATE_FILTER_FIELD, {})


def retrieve_raw_data_file(s3_bucket, s3_key):
    try:
        local_data_file = LOCAL_DATA_FILE
        print(f"Retrieving raw data from s3://{s3_bucket}/{s3_key}")
        s3_client.download_file(s3_bucket, s3_key, local_data_file)
        return local_data_file
    except Exception as e:
        complete_with_error(e)


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


def prepare_cases(cases, upload_id):
    """
    Populates standard required fields for the G.h Case API.

    TODO: Migrate source_id/source_url to this method.
    """
    for case in cases:
        case["caseReference"]["uploadId"] = upload_id
        case["caseReference"]["verificationStatus"] = UNVERIFIED_STATUS
    return cases


def write_to_server(cases, source_id, upload_id, headers):
    """Upserts the provided cases via the G.h Case API."""
    put_api_url = f"{os.environ['SOURCE_API_URL']}/cases/batchUpsert"
    print(f"Sending {len(cases)} cases to {put_api_url}")
    res = requests.post(put_api_url, json={"cases": cases},
                        headers=headers)
    if res and res.status_code == 200:
        res_json = res.json()
        # TODO: Look for "errors" in res_json and handle them in some way.
        return len(res_json["createdCaseIds"]), len(res_json["updatedCaseIds"])
    e = RuntimeError(
        f'Error sending cases to server, status={res.status_code}, response={res.text}')
    # 207 encompasses both geocoding and case schema validation errors.
    # We can consider separating geocoding issues, but for now classifying it
    # as a validation problem is pretty reasonable.
    upload_error = (UploadError.VALIDATION_ERROR
                    if res.status_code == 207 else
                    UploadError.DATA_UPLOAD_ERROR)
    complete_with_error(e, upload_error,
                        source_id, upload_id, headers)


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


def get_today():
    """Return today's datetime, just here for easier mocking."""
    return datetime.datetime.today()


def filter_cases_by_date(
        case_data, date_filter, source_id, upload_id, api_creds):
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
            e = ValueError(f'Unsupported date filter operand: {op}')
            complete_with_error(
                e, UploadError.SOURCE_CONFIGURATION_ERROR, source_id, upload_id,
                api_creds)

    return [case for case in case_data if case_is_within_range(case, cutoff_date, op)]


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

    source_url, source_id, upload_id, s3_bucket, s3_key, date_filter = extract_event_fields(
        event)
    api_creds = common_lib.obtain_api_credentials(s3_client)
    if not upload_id:
        upload_id = create_upload_record(source_id, api_creds)
    try:
        raw_data_file = retrieve_raw_data_file(s3_bucket, s3_key)
        case_data = parsing_function(
            raw_data_file, source_id,
            source_url)
        final_cases = prepare_cases(case_data, upload_id)
        count_created, count_updated = write_to_server(
            filter_cases_by_date(
                final_cases,
                date_filter,
                source_id, upload_id,
                api_creds),
            source_id, upload_id,
            api_creds)
        finalize_upload(source_id, upload_id, api_creds, count_created,
                        count_updated)
        return {"count_created": count_created, "count_updated": count_updated}
    except Exception as e:
        complete_with_error(e, UploadError.INTERNAL_ERROR,
                            source_id, upload_id, api_creds)
