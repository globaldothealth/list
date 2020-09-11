import json
import os
import sys
from datetime import date, datetime

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

def convert_gender(raw_gender):
    if "gender" in raw_gender:
        if raw_gender["gender"] == "M":
            return "Male"
        if raw_gender["gender"] == "F":
            return "Female"

def convert_age(raw_age):
    age_range = {}
    if raw_age["ageBracket"] != -1:
        age_range["start"] = raw_age["ageBracket"]
        age_range["end"] = raw_age["ageBracket"] + 9
        return age_range
    else:
        return None

def convert_location(raw_entry):
    query_terms = [
        term for term in [
            raw_entry.get("detectedCityTown", ""),
            raw_entry.get("detectedPrefecture", ""),
            "Japan"]
        if term and term != "Unspecified"]
    return {"query":  ", ".join(query_terms)}

def detect_notes(raw_notes):
    if "notes" in raw_notes:
        return raw_notes["notes"]
    else:
        return None

def convert_date(raw_date: str):
    """ 
    Convert raw date field into a value interpretable by the dataserver.

    The date filtering API expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d")
    return date.strftime("%m/%d/%YZ")

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        cases = json.load(f)
        return (
            {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["patientId"],
                    "sourceUrl": source_url
                },
                "location": convert_location(entry),
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry["dateAnnounced"]),
                            "end": convert_date(entry["dateAnnounced"]),
                        }
                    }
                ],
                "demographics": {
                    "ageRange": convert_age(entry),
                    "gender": convert_gender(entry)
                },
                "notes": detect_notes(entry)
            } for entry in cases if entry["patientId"] != "-1")


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
