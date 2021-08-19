import datetime
import json
import os
import sys
import tempfile
import collections
import contextlib
import time
from typing import Callable, Dict, Generator, Any, List

import boto3
import requests
import requests.exceptions

import common_lib

ENV_FIELD = "env"
SOURCE_URL_FIELD = "sourceUrl"
S3_BUCKET_FIELD = "s3Bucket"
S3_KEY_FIELD = "s3Key"
SOURCE_ID_FIELD = "sourceId"
UPLOAD_ID_FIELD = "uploadId"
DATE_FILTER_FIELD = "dateFilter"
DATE_RANGE_FIELD = "dateRange"
AUTH_FIELD = "auth"

# Maximum exponential backoff times
MAX_WAIT_TIME = 600  # 5xx errors from data service
MAX_CONN_WAIT_TIME = 900  # connection errors from data service

# Expected date fields format.
DATE_FORMATS = ["%m/%d/%YZ", "%m/%d/%Y"]

# Number of cases to upload in batch.
# Increasing that number will speed-up the ingestion but will increase memory
# usage on the server-side and is known to cause OOMs so increase with caution.
CASES_BATCH_SIZE = 250

s3_client = boto3.client("s3")

if os.environ.get("DOCKERIZED"):
    s3_client = boto3.client("s3",
        endpoint_url=os.environ.get("AWS_ENDPOINT", "http://localstack:4566"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
        region_name=os.environ.get("AWS_REGION", "us-east-1")
    )


def safe_int(x):
    try:
        return int(x)
    except (ValueError, TypeError):
        return None


def extract_event_fields(event: Dict):
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
        S3_BUCKET_FIELD], event[S3_KEY_FIELD], event.get(DATE_FILTER_FIELD, None), event.get(DATE_RANGE_FIELD, None), event.get(AUTH_FIELD, None)


def retrieve_raw_data_file(s3_bucket: str, s3_key: str, out_file):
    try:
        print(f"Retrieving raw data from s3://{s3_bucket}/{s3_key}")
        s3_client.download_fileobj(s3_bucket, s3_key, out_file)
    except Exception as e:
        common_lib.complete_with_error(e)

def retrieve_excluded_case_ids(source_id: str, date_filter: Dict, date_range: Dict, env: str,
                               headers=None, cookies=None):
    if date_range:
        start_date = date_range["start"]
        end_date = date_range["end"]
        date_limits = f"&dateFrom={start_date}&dateTo={end_date}"

    elif date_filter:
        now = get_today()
        delta = datetime.timedelta(days=date_filter["numDaysBeforeToday"])
        cutoff_date = now - delta
        start_date = datetime.datetime.strftime(cutoff_date, "%Y-%m-%d")
        end_date = datetime.datetime.strftime(now, "%Y-%m-%d")
        date_limits = f"&dateFrom={start_date}&dateTo={end_date}"

    else:
        now = get_today()
        start_date = '2019-12-01'
        end_date = datetime.datetime.strftime(now, "%Y-%m-%d")
        date_limits = f"&dateFrom={start_date}&dateTo={end_date}"

    excluded_case_ids_endpoint_url =  f"{common_lib.get_source_api_url(env)}/excludedCaseIds?sourceId={source_id}{date_limits}"
    res = requests.get(excluded_case_ids_endpoint_url, headers=headers, cookies=cookies)
    if res and res.status_code == 200:
        res_json = res.json()
        return res_json["cases"]
    return None

def prepare_cases(cases: Generator[Dict, None, None], upload_id: str, excluded_case_ids: list):
    """
    Populates standard required fields for the G.h Case API.

    TODO: Migrate source_id/source_url to this method.
    """
    for case in cases:
        case["caseReference"]["uploadIds"] = [upload_id]
        if (excluded_case_ids is None) or ("sourceEntryId" not in case["caseReference"]) or (not case["caseReference"]["sourceEntryId"] in excluded_case_ids):
            yield remove_nested_none_and_empty(case)


def remove_nested_none_and_empty(d):
    if not isinstance(d, (dict, list)):
        return d
    if isinstance(d, list):
        return [v for v in (remove_nested_none_and_empty(v) for v in d) if v is not None and v != ""]
    return {k: v for k, v in ((k, remove_nested_none_and_empty(v)) for k, v in d.items()) if v is not None and v != ""}


def batch_of(cases: Generator[Dict, None, None], max_items: int) -> List[Dict]:
    n = 0
    batch = []
    try:
        while n < max_items:
            batch.append(next(cases))
            n += 1
        return batch
    except StopIteration:
        return batch


def write_to_server(
        cases: Generator[Dict, None, None],
        env: str, source_id: str, upload_id: str, headers, cookies,
        cases_batch_size: int):
    """Upserts the provided cases via the G.h Case API."""
    source_api_url = common_lib.get_source_api_url(env)
    put_api_url = f"{source_api_url}/cases/batchUpsert"
    upload_status_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    print(f'Prod URL: {put_api_url}')
    counter = collections.defaultdict(int)
    counter['batch_num'] = 0
    start_time = time.time()
    while True:
        batch_num = counter['batch_num']
        counter['batch_num'] += 1
        batch = batch_of(cases, cases_batch_size)
        # End of batch.
        if not batch:
            break
        # There are two exponential backoffs:
        # * wait, total_wait keeps track of the backoff from 5xx errors
        # * conn_wait, total_conn_wait tracks backoff for connection errors
        total_wait = 0
        total_conn_wait = 0
        wait = 10  # initial wait time in seconds
        conn_wait = 30
        print(f"Sending {len(batch)} cases, total so far: {counter['total']}")
        # Exponential backoff in dev and prod, but not for local testing
        while (
            total_wait <= (MAX_WAIT_TIME if env in ["dev", "prod"] else 0)
            and total_conn_wait < MAX_CONN_WAIT_TIME
        ):
            try:
                res = requests.post(put_api_url, json={"cases": batch},
                                    headers=headers, cookies=cookies)
            except requests.exceptions.ConnectionError:
                print(f"Failed to connect to data service, waiting {conn_wait}s")
                time.sleep(conn_wait)
                total_conn_wait += conn_wait
                conn_wait *= 2
                continue
            if res.status_code in [200, 207]:  # 207 is used for validation error
                break
            if res.status_code == 500 and "401" in res.text:
                print(f"Request failed, status={res.status_code}, response={res.text}, reauthenticating...")
                headers = common_lib.obtain_api_credentials(s3_client)
                continue
            print(f"Request failed, status={res.status_code}, response={res.text}, retrying in {wait} seconds...")
            time.sleep(wait)
            total_wait += wait
            wait *= 2

        if total_conn_wait >= MAX_CONN_WAIT_TIME:
            # data service has failed, raise alert
            notifymsg = f"[!] *Failed to connect to data-{env}* during {source_id} ingestion"
            if webhook_url := os.getenv('NOTIFY_WEBHOOK_URL'):
                with contextlib.suppress(requests.exceptions.RequestException):
                    requests.post(webhook_url, json={"text": notifymsg})
            common_lib.complete_with_error(
                ConnectionError("Could not connect to data service"),
                env,
                common_lib.UploadError.INTERNAL_ERROR,
                source_id, upload_id, headers, cookies,
                count_created=counter['numCreated'],
                count_updated=counter['numUpdated'],
                count_error=counter['numError']
            )
            return

        if res and res.status_code in [200, 207]:
            counter['total'] += len(batch)
            now = time.time()
            cps = int(counter['total'] / (now - start_time))
            print(f'\tCurrent speed: {cps} cases/sec')
            res_json = res.json()
            counter['numCreated'] += res_json["numCreated"]
            counter['numUpdated'] += res_json["numUpdated"]
            if res.status_code == 207:
                # 207 encompasses both geocoding and case schema validation errors.
                # We can consider separating geocoding issues, but for now classifying it
                # as a validation problem is pretty reasonable.
                # The motivation for continuing past 207 errors is https://github.com/globaldothealth/list/issues/1849

                # The errors from the backend tell us which cases failed and for what reason. Make it
                # easier to diagnose by extracting the failing case and attaching it to the error message.
                res_json = res.json()
                if 'errors' in res_json:
                    def add_input_to_error(error):
                        res = dict(error)
                        res['input'] = batch[error['index']]
                        return res
                    augmented_errors = [add_input_to_error(e) for e in res_json['errors']]
                    reported_error = dict(res_json)
                    reported_error['errors'] = augmented_errors
                    print(f"Validation error in batch {batch_num}:", json.dumps(reported_error))
                    counter['numError'] += len(res_json['errors'])
                else:
                    print(f"Validation error in batch {batch_num}: {res.text}")
            update_status = {
                'status': 'IN_PROGRESS',
                'summary': {
                    'numCreated': counter['numCreated'],
                    'numUpdated': counter['numUpdated'],
                    'numError': counter['numError']
                }
            }
            with contextlib.suppress(requests.exceptions.RequestException):
                requests.put(upload_status_url, json=update_status, headers=headers, cookies=cookies)
            continue

        # Response can contain an 'error' field which describe each error that
        # occurred, it will be contained in the res.text here below.
        e = RuntimeError(
            f'Error sending cases to server, status={res.status_code}, response={res.text}')
        upload_error = common_lib.UploadError.DATA_UPLOAD_ERROR
        common_lib.complete_with_error(
            e, env, upload_error,
            source_id, upload_id, headers, cookies,
            count_created=counter['numCreated'],
            count_updated=counter['numUpdated'],
            count_error=counter['numError']
        )
        return
    print(f'sent {counter["total"]} cases in {time.time() - start_time} seconds')
    return counter['numCreated'], counter['numUpdated'], counter['numError']


def get_today() -> datetime.datetime:
    """Return today's datetime, just here for easier mocking."""
    return datetime.datetime.today()


def get_case_date(date_string) -> datetime.datetime:
    """Return a datetime parsed from a case."""
    case_date = ""
    for fmt in (DATE_FORMATS):
        try:
            return datetime.datetime.strptime(
                date_string,
                fmt)
        except ValueError:
            pass
    if not case_date:
        raise ValueError(f"Date {date_string} from case could not be parsed.")

    return case_date


def filter_cases_by_date(
        case_data: Generator[Dict, None, None],
        date_filter: Dict, date_range: Dict, env: str,
        source_id: str, upload_id: str, api_creds, cookies):
    """
    Filter cases according to the date_range or date_filter provided.

    If a date_range is provided, returns only cases within the specified start
    and end bounds (inclusive). Else if date_filter is provided, returns the
    cases within that specification. Else, returns all cases.

    Notice that if _both_ date_range and date_filter are provided, then date_range is used
    and date_filter is ignored.
    """
    if date_range:
        print(f'Filtering cases using date range {date_range}')

        def case_is_within_range(case, start, end):
            confirmed_event = [e for e in case["events"]
                               if e["name"] == "confirmed"][0]
            case_date = get_case_date(confirmed_event["dateRange"]["start"])
            return start <= case_date <= end

        start = datetime.datetime.strptime(date_range["start"], "%Y-%m-%d")
        end = datetime.datetime.strptime(date_range["end"], "%Y-%m-%d")
        return (case for case in case_data if case_is_within_range(case, start, end))

    elif date_filter:
        print(f'Filtering cases using date filter {date_filter}')
        now = get_today()
        delta = datetime.timedelta(days=date_filter["numDaysBeforeToday"])
        cutoff_date = now - delta
        op = date_filter["op"]

        def case_is_within_range(case, cutoff_date, op):
            confirmed_event = [e for e in case["events"]
                               if e["name"] == "confirmed"][0]
            case_date = get_case_date(confirmed_event["dateRange"]["start"])
            delta_days = (case_date - cutoff_date).days
            if op == "EQ":
                return delta_days == 0
            elif op == "LT":
                return delta_days < 0
            elif op == "GT":
                return delta_days > 0
            else:
                e = ValueError(f'Unsupported date filter operand: {op}')
                common_lib.complete_with_error(
                    e, env, common_lib.UploadError.SOURCE_CONFIGURATION_ERROR,
                    source_id, upload_id, api_creds, cookies)

        return (case for case in case_data if case_is_within_range(case, cutoff_date, op))

    else:
        return case_data


class ParserError(Exception):
    pass


def run(
        event: Dict,
        parsing_function: Callable[[str, str, str], Generator[Dict, None, None]]):
    """
    Encapsulates all of the work performed by a parsing Lambda.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict.
        This must contain `s3Bucket`, `s3Key`, and `sourceUrl` fields specifying
        the details of the stored source content.

    parsing_function: function, required
        Python function that parses raw source data into G.h case data.
        This function must accept (in order): a file containing raw source
        data, a string representing the source UUID, and a string representing
        the source URL. It must yield each case conforming to the G.h
        case format as per https://data.covid-19.global.health/api-docs/.
        For an example, see:
          https://github.com/globaldothealth/list/blob/main/ingestion/functions/parsing/india/india.py#L57

    Returns
    ------
    JSON object containing the count of line list cases successfully written to
    G.h servers in the format:
        {"count_created": count_created, "count_updated": count_updated}
    For more information on return types, see:
        https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    env, source_url, source_id, upload_id, s3_bucket, s3_key, date_filter, date_range, local_auth = extract_event_fields(
        event)
    api_creds = None
    cookies = None
    if local_auth and env == 'local':
        cookies = common_lib.login(local_auth['email'])
    else:
        api_creds = common_lib.obtain_api_credentials(s3_client)
    if not upload_id:
        upload_id = common_lib.create_upload_record(
            env, source_id, api_creds, cookies)
    # grab the source object
    base_url = common_lib.get_source_api_url(env)
    source_info_url = f"{base_url}/sources/{source_id}"
    source_info_request = requests.get(source_info_url, headers=api_creds, cookies=cookies)
    # if that failed then just bail, we can't ingest the cases
    if source_info_request.status_code > 299: # yes I'm ignoring redirects
        common_lib.complete_with_error(
            ParserError(f"Retrieving source info for source {source_id} yielded HTTP status {source_info_request.status_code}"),
            env, common_lib.UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_creds, cookies)
    try:
        fd, local_data_file_name = tempfile.mkstemp()
        local_data_file = os.fdopen(fd, "wb")
        retrieve_raw_data_file(s3_bucket, s3_key, local_data_file)
        print(f'Raw file retrieved at {local_data_file_name}')

        case_data = parsing_function(
            local_data_file_name, source_id,
            source_url)
        excluded_case_ids = retrieve_excluded_case_ids(source_id, date_filter, date_range, env,
                                                       headers=api_creds, cookies=cookies)
        final_cases = prepare_cases(case_data, upload_id, excluded_case_ids)
        count_created, count_updated, count_error = write_to_server(
            filter_cases_by_date(
                final_cases,
                date_filter,
                date_range,
                env, source_id, upload_id,
                api_creds, cookies),
            env, source_id, upload_id,
            api_creds, cookies,
            CASES_BATCH_SIZE)
        for _ in range(5):  # Maximum number of attempts to finalize upload
            status, text = common_lib.finalize_upload(
                env, source_id, upload_id, api_creds, cookies, count_created,
                count_updated, count_error
            )
            if status == 200:
                break
            elif status == 500 and "401" in text:
                print("Finalizing upload failed with 401, reauthenticating...")
                api_creds = common_lib.obtain_api_credentials(s3_client)
                continue
            else:
                raise RuntimeError(f'Error updating upload record, status={status}, response={text}')
        return {"count_created": count_created, "count_updated": count_updated}
    except Exception as e:
        common_lib.complete_with_error(
            e, env, common_lib.UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_creds, cookies)
    finally:
        local_data_file.close()
        if os.path.exists(local_data_file_name):
            os.remove(local_data_file_name)
