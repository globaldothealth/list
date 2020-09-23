import json
import os
import sys
from datetime import datetime

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import parsing_lib
except ImportError:
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


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
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
        return (
            {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["entryid"],
                    "sourceUrl": source_url
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
                    "gender": convert_gender(entry["gender"])
                },
                "notes": entry["notes"] or None
            } for entry in cases["raw_data"] if entry["agebracket"])


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
