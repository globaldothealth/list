import datetime
import os
import sys
import tempfile

import boto3
import google.auth.transport.requests
import requests
from google.oauth2 import service_account

# TODO: Use tempfile here instead.
LOCAL_DATA_FILE = "/tmp/rawdata"
SOURCE_URL_FIELD = "sourceUrl"
S3_BUCKET_FIELD = "s3Bucket"
S3_KEY_FIELD = "s3Key"
SOURCE_ID_FIELD = "sourceId"
DATE_FILTER_FIELD = "dateFilter"

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


def extract_event_fields(event):
    print('Extracting fields from event', event)
    if any(
            field not in event
            for field in [SOURCE_URL_FIELD, SOURCE_ID_FIELD, S3_BUCKET_FIELD, S3_KEY_FIELD]):
        error_message = (
            f"Required fields {SOURCE_URL_FIELD}; {S3_BUCKET_FIELD}; "
            f"{SOURCE_ID_FIELD}; {S3_KEY_FIELD} not found in input event json.")
        print(error_message)
        raise ValueError(error_message)
    return event[SOURCE_URL_FIELD], event[SOURCE_ID_FIELD], event[S3_BUCKET_FIELD], event[S3_KEY_FIELD], event.get(DATE_FILTER_FIELD, {})


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
    """Upserts the provided cases via the G.h Case API."""
    put_api_url = f"{os.environ['SOURCE_API_URL']}/cases/batchUpsert"
    print(f"Sending {len(cases)} cases to {put_api_url}")
    res = requests.post(put_api_url, json={"cases": cases},
                       headers=headers)
    res_json = res.json()
    if res.status_code != 200:
        raise RuntimeError(f'Error sending cases to server, status={res.status_code}, response={res_json}')
    # TODO: Look for "errors" in res_json and handle them in some way.
    return len(res_json["createdCaseIds"]), len(res_json["updatedCaseIds"])


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
        confirmed_event = [e for e in case["events"] if e["name"] == "confirmed"][0]
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

    source_url, source_id, s3_bucket, s3_key, date_filter = extract_event_fields(event)
    raw_data_file = retrieve_raw_data_file(s3_bucket, s3_key)
    case_data = parsing_function(
        raw_data_file, source_id,
        source_url)
    api_creds = common_lib.obtain_api_credentials(s3_client)
    count_created, count_updated = write_to_server(
        filter_cases_by_date(case_data, date_filter), api_creds)
    return {"count_created": count_created, "count_updated": count_updated}
