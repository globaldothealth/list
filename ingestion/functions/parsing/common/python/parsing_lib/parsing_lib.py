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

ENV_FIELD = "env"
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
from common_lib import UploadError


def extract_event_fields(event):
    print('Extracting fields from event', event)
    if any(
        field not in event
        for field
        in
        [ENV_FIELD, SOURCE_URL_FIELD, SOURCE_ID_FIELD, S3_BUCKET_FIELD,
         S3_KEY_FIELD]):
        error_message = (
            f"Required fields {ENV_FIELD}; {SOURCE_URL_FIELD}; {S3_BUCKET_FIELD}; "
            f"{SOURCE_ID_FIELD}; {S3_KEY_FIELD} not found in input event json.")
        e = ValueError(error_message)
        common_lib.complete_with_error(e)
    return event[ENV_FIELD], event[SOURCE_URL_FIELD], event[SOURCE_ID_FIELD], event.get(UPLOAD_ID_FIELD), event[
        S3_BUCKET_FIELD], event[S3_KEY_FIELD], event.get(DATE_FILTER_FIELD, {})


def retrieve_raw_data_file(s3_bucket, s3_key):
    try:
        local_data_file = LOCAL_DATA_FILE
        print(f"Retrieving raw data from s3://{s3_bucket}/{s3_key}")
        s3_client.download_file(s3_bucket, s3_key, local_data_file)
        return local_data_file
    except Exception as e:
        common_lib.complete_with_error(e)


def prepare_cases(cases, upload_id):
    """
    Populates standard required fields for the G.h Case API.

    TODO: Migrate source_id/source_url to this method.
    """
    for case in cases:
        case["caseReference"]["uploadId"] = upload_id
        case["caseReference"]["verificationStatus"] = UNVERIFIED_STATUS
    return cases


def write_to_server(cases, env, source_id, upload_id, headers):
    """Upserts the provided cases via the G.h Case API."""
    put_api_url = f"{common_lib.get_source_api_url(env)}/cases/batchUpsert"
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
    common_lib.complete_with_error(e, env, upload_error,
                                   source_id, upload_id, headers)


def get_today():
    """Return today's datetime, just here for easier mocking."""
    return datetime.datetime.today()


def filter_cases_by_date(
        case_data, date_filter, env, source_id, upload_id, api_creds):
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
            common_lib.complete_with_error(
                e, env, UploadError.SOURCE_CONFIGURATION_ERROR, source_id,
                upload_id, api_creds)

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

    env, source_url, source_id, upload_id, s3_bucket, s3_key, date_filter = extract_event_fields(
        event)
    api_creds = common_lib.obtain_api_credentials(s3_client)
    if not upload_id:
        upload_id = common_lib.create_upload_record(env, source_id, api_creds)
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
                env, source_id, upload_id,
                api_creds),
            env, source_id, upload_id,
            api_creds)
        common_lib.finalize_upload(
            env, source_id, upload_id, api_creds, count_created, count_updated)
        return {"count_created": count_created, "count_updated": count_updated}
    except Exception as e:
        common_lib.complete_with_error(e, env, UploadError.INTERNAL_ERROR,
                                       source_id, upload_id, api_creds)
