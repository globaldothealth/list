import json
import os
import sys
from datetime import datetime
from typing import Dict


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
    if "ageBracket" not in raw_age.keys():
        return None
    else:
        age_range = {}
        if raw_age["ageBracket"] != -1:
            age_range["start"] = raw_age["ageBracket"]
            age_range["end"] = raw_age["ageBracket"] + 9
            return age_range
        else:
            return None


def convert_location(raw_entry):
    if raw_entry["detectedPrefecture"] == "Port Quarantine":
        return {"query": "Japan"}
    else:
        query_terms = [
            term for term in [
                raw_entry.get("detectedCityTown", ""),
                raw_entry.get("detectedPrefecture", ""),
                "Japan"]
            if term and term != "Unspecified"]
        return {"query": ", ".join(query_terms)}


def detect_notes(raw_notes):
    if "notes" in raw_notes:
        return raw_notes["notes"]
    else:
        return None


def convert_date(raw_date: Dict):
    """
    Convert raw date field into a value interpretable by the dataserver.
​
    The date filtering API expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date["dateAnnounced"], "%Y-%m-%d")
    return date.strftime("%m/%d/%YZ")


def convert_additional_sources(additional_source_url: Dict):
    sources = []
    if "sourceURL" in additional_source_url:
        sources.append({"sourceUrl": additional_source_url["sourceURL"]})
    if "deathSourceURL" in additional_source_url:
        sources.append({"sourceUrl": additional_source_url["deathSourceURL"]})
    if "citySourceURL" in additional_source_url:
        sources.append({"sourceUrl": additional_source_url["citySourceURL"]})
    if "prefectureSourceURL" in additional_source_url:
        sources.append({"sourceUrl": additional_source_url["prefectureSourceURL"]})
    # Ensure only unique entries in additional sources
    return list({v["sourceUrl"]: v for v in sources}.values()) or None


def convert_outcome(raw_outcome: Dict, raw_death_date: Dict):
    if "patientStatus" in raw_outcome:
        if raw_outcome["patientStatus"] == "Deceased":
            death_date = datetime.strptime(
                raw_death_date["deceasedDate"], "%Y-%m-%d")
            return {"name": "outcome",
                    "dateRange": {
                        "start": death_date.strftime("%m/%d/%YZ"),
                        "end": death_date.strftime("%m/%d/%YZ")
                    },
                    "value": "Death"}
        elif raw_outcome["patientStatus"] == "Discharged" or raw_outcome["patientStatus"] == "Recovered":
            return {"name": "outcome",
                    "value": "Recovered"}
    return {"name": "outcome",
            "value": "Unknown"}


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
                    "sourceUrl": source_url,
                    "additionalSources": convert_additional_sources(entry)
                },
                "location": convert_location(entry),
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry),
                            "end": convert_date(entry)
                        }
                    },
                    convert_outcome(entry, entry)
                ],
                "demographics": {
                    "ageRange": convert_age(entry),
                    "gender": convert_gender(entry)
                },
                "notes": detect_notes(entry)
            } for entry in cases if (entry["patientId"] != "-1" and entry["confirmedPatient"]))


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
