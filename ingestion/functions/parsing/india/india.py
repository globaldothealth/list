import boto3
import json
import os
import requests
import google.auth.transport.requests
from google.oauth2 import service_account
from datetime import date, datetime


LOCAL_DATA_FILE = "/tmp/data.json"
METADATA_BUCKET = "epid-ingestion"
SERVICE_ACCOUNT_CRED_FILE = "covid-19-map-277002-0943eeb6776b.json"
SOURCE_URL_FIELD = "sourceUrl"
S3_BUCKET_FIELD = "s3Bucket"
S3_KEY_FIELD = "s3Key"
S3_KEY_PATH_SEPERATOR = "/"

s3_client = boto3.client("s3")


def extract_event_fields(event):
    if any(field not in event for field in [S3_BUCKET_FIELD, S3_KEY_FIELD]):
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


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in dd/mm/YYYY format, but the data server API will
    assume that ambiguous cases (e.g. "05/06/2020") are in mm/dd/YYYY format.
    """
    date = datetime.strptime(raw_date, "%d/%m/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_sex(raw_sex):
    if raw_sex == "M":
        return "Male"
    if raw_sex == "F":
        return "Female"
    return None


def convert_location(raw_entry):
    state = raw_entry["detectedstate"]
    district = raw_entry["detecteddistrict"]
    city = raw_entry["detectedcity"]

    query_terms = ("India",)
    location = {"country": "India"}
    if state:
        location["administrativeAreaLevel1"] = state
        query_terms = (state,) + query_terms
    if district:
        location["administrativeAreaLevel2"] = district
        query_terms = (district,) + query_terms
    if city:
        location["administrativeAreaLevel3"] = city
        query_terms = (city,) + query_terms

    location["query"] = ", ".join(query_terms)
    return location


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses GHDSI-format case data from raw API data.

    Two primary caveats at present:
        1. We aren't converting all fields yet.
        2. We're restricting ourselves to data with an `agebracket` present.
           This data has an interesting format in which some rows represent
           aggregate data. We need to add handling logic; until we've done so,
           this filter is used to process strictly line list data.
    """
    with open(raw_data_file, "r") as f:
        cases = json.load(f)
        return [
            {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["entryid"]
                },
                "revisionMetadata": {
                    "revisionNumber": 0,
                    "creationMetadata": {
                        "curator": "auto",
                        "date": date.today().strftime("%m/%d/%Y")
                    }
                },
                "sources": [
                    {
                        "url": source_url,
                    }
                ],
                "location": convert_location(entry),
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry["dateannounced"]),
                            "end": convert_date(entry["dateannounced"])
                        }
                    }
                ],
                "demographics": {
                    "ageRange": {
                        "start": float(entry["agebracket"].split(" ", 1)[0]),
                        "end": float(entry["agebracket"].split(" ", 1)[0])
                    },
                    "sex": convert_sex(entry["gender"])
                },
                "notes": entry["notes"] or None
            } for entry in cases["raw_data"] if entry["agebracket"]]


def write_to_server(cases, headers):
    count_success = 0
    count_error = 0
    put_api_url = f"{os.environ['SOURCE_API_URL']}/cases"
    print(f"Sending {len(cases)} cases to {put_api_url}")
    for case in cases:
        try:
            r = requests.put(put_api_url, json=case,
                             headers=headers).raise_for_status()
            count_success += 1
        except Exception as e:
            print(e)
            count_error += 1
    return count_success, count_error


def obtain_api_credentials():
    """
    Creates HTTP headers credentialed for access to the EPID Source API.
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


def lambda_handler(event, context):
    """
    Case data parsing function for the COVID19-India API.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict.
        This must contain both `s3Bucket` and `s3Key` fields specifying the
        location of the stored source content.

    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    JSON object containing the count of line list cases successfully written to
    GHDSI servers.
    For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    source_url, s3_bucket, s3_key = extract_event_fields(event)
    raw_data_file = retrieve_raw_data_file(s3_bucket, s3_key)
    case_data = parse_cases(
        raw_data_file, extract_source_id(s3_key),
        source_url)
    api_creds = obtain_api_credentials()
    count_success, count_error = write_to_server(case_data, api_creds)
    return {"count_success": count_success, "count_error": count_error}
