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
    prefecture = raw_entry["detectedPrefecture"]
    if "detectedCityTown" in raw_entry:
        city = raw_entry["detectedCityTown"]
    else:
        city = ""
    
    query_terms = ("Japan",)
    location = {"country": "Japan"}
    if prefecture:
        location["administrativeAreaLevel1"] = prefecture
        query_terms = (prefecture,) + query_terms
    if city:
        if prefecture == "Tokyo":
            location["administrativeAreaLevel2"] = city
        else:
            location["administrativeAreaLevel3"] = city
        query_terms = (city,) + query_terms

    location["query"] = ", ".join(query_terms)
    return location

def detect_notes(raw_notes):
    if "notes" in raw_notes:
        return raw_notes["notes"]
    else:
        return None

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        cases = json.load(f)
        return [
            {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["patientId"],
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
                            "start": entry["dateAnnounced"],
                            "end": entry["dateAnnounced"]
                        }
                    }
                ],
                "demographics": {
                    "ageRange": convert_age(entry),
                    "gender": convert_gender(entry)
                },
                "notes": detect_notes(entry)
            } for entry in cases if entry["patientId"] != "-1"]


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
