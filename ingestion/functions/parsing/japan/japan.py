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


def convert_gender(raw_gender):
    try:
        if raw_gender["gender"] == "M":
            return "Male"
    except KeyError:
        return "Unknown"

    try:
        if raw_gender["gender"] == "F":
            return "Female"
    except KeyError:
        return "Unknown"

def convert_age(raw_age):
    age_range = []
    if raw_age["ageBracket"] != -1:
        age_range.append(raw_age["ageBracket"]),
        age_range.append(raw_age["ageBracket"] + 9)
    else:
        age_range.append(""),
        age_range.append("")
    return age_range
        

def convert_location(raw_entry):
    prefecture = raw_entry["detectedPrefecture"]
    try:
       city = raw_entry["detectedCityTown"]
    except KeyError:
        city = ""
    
    query_terms = ("Japan",)
    location = {"country": "Japan"}
    if prefecture:
        location["administrativeAreaLevel1"] = prefecture
        query_terms = (prefecture,) + query_terms
    if city:
        location["administrativeAreaLevel2"] = city
        if city != "":
            query_terms = (city,) + query_terms

    location["query"] = ", ".join(query_terms)
    return location

def detect_notes(raw_notes):
    try:
        return raw_notes["notes"]
    except KeyError:
        return ""

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
                    "ageRange": {
                        "start": convert_age(entry)[0],
                        "end": convert_age(entry)[1]
                    },
                    "gender": convert_gender(entry)
                },
                "notes": detect_notes(entry)
            } for entry in cases if entry["patientId"] != "-1"]


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
