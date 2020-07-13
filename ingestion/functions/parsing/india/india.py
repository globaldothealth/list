import json
import os
import sys
from datetime import date, datetime

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if ('lambda' not in sys.argv[0]):
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'common/python'))
import parsing_lib


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
    Parses G.h-format case data from raw API data.

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
                    "sourceEntryId": entry["entryid"],
                    "sourceUrl": source_url
                },
                "revisionMetadata": {
                    "revisionNumber": 0,
                    "creationMetadata": {
                        "curator": "auto",
                        "date": date.today().strftime("%m/%d/%Y")
                    }
                },
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


def lambda_handler(event, context):
    """
    Case data parsing function for the COVID19-India API.

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

    Returns
    ------
    JSON object containing the count of line list cases successfully written to
    G.h servers.
    For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    source_url, s3_bucket, s3_key = parsing_lib.extract_event_fields(event)
    raw_data_file = parsing_lib.retrieve_raw_data_file(s3_bucket, s3_key)
    case_data = parse_cases(
        raw_data_file, parsing_lib.extract_source_id(s3_key),
        source_url)
    api_creds = parsing_lib.obtain_api_credentials()
    count_success, count_error = parsing_lib.write_to_server(
        case_data, api_creds)
    return {"count_success": count_success, "count_error": count_error}
