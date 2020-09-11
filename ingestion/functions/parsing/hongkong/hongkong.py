import os
import sys
from datetime import datetime
import csv

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

# Fixed location, all cases are for Hong Kong.
_LOCATION = {
    # "One country, two systems". We only store countries here.
    "country": "China",
    "administrativeAreaLevel1": "Hong Kong",
    "geoResolution": "Admin1",
    "name": "Hong Kong",
    "geometry": {
        "longitude": "114.15861",
        "latitude": "22.27833",
    },
}

_CASE_ID_INDEX = 0
_CONFIRMED_INDEX = 1
_ONSET_INDEX = 2
_GENDER_INDEX = 3
_AGE_INDEX = 4
_OUTCOME_INDEX = 6
_NOTES_INDEX = 8
_CERTAINTY_INDEX = 9


def convert_date(raw_date: str):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    # The date is inconsistently listed in dd/mm/YYYY format or in d/m/yy
    # we pad the latter to make it look the same and be parseable.
    day, month, year = raw_date.split("/")
    day = day.zfill(2)
    month = month.zfill(2)
    formatYear = "%Y"
    if len(year) == 2:
        formatYear = "%y"
    date = datetime.strptime(raw_date, f"%d/%m/{formatYear}")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender.upper() == "M":
        return "Male"
    elif raw_gender.upper() == "F":
        return "Female"
    return None


def convert_age(age: float):
    return {
        "start": age,
        "end": age,
    }


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data."""
    with open(raw_data_file, "r") as f:
        reader = csv.reader(f)
        next(reader)  # Skip the header.
        cases = []
        for row in reader:
            # CSV contains both "Probable" and "Confirmed" cases.
            # We only ingest confirmed cases.
            if row[_CERTAINTY_INDEX] != "Confirmed":
                print('Skipping probable case')
                continue
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": row[_CASE_ID_INDEX],
                    "sourceUrl": source_url
                },
                "location": _LOCATION,
                "demographics": {
                    "gender": convert_gender(row[_GENDER_INDEX]),
                    "ageRange": convert_age(float(row[_AGE_INDEX])),
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(row[_CONFIRMED_INDEX]),
                            "end": convert_date(row[_CONFIRMED_INDEX]),
                        },
                    },
                ],
                "notes": row[_NOTES_INDEX],
            }
            # If patient was symptomatic, the onset date is set otherwise they are marked
            # as "Asymptomatic" in the date column in the CSV.
            # There are other values as well such as "Pending" or "Unknown".
            if row[_ONSET_INDEX] == "Asymptomatic":
                case["symptoms"] = {
                    "status": "Asymptomatic",
                }
            elif "/" in row[_ONSET_INDEX]:
                case["symptoms"] = {
                    "status": "Symptomatic",
                }
                case["events"].append({
                    "name": "onsetSymptoms",
                    "dateRange": {
                        "start": convert_date(row[_ONSET_INDEX]),
                        "end": convert_date(row[_ONSET_INDEX]),
                    }
                })
            # Status can be Hospitalised/Discharged/Deceased.
            if row[_OUTCOME_INDEX] == "Discharged":
                case["events"].append({
                    "name": "outcome",
                    "value": "Recovered",
                })
            elif row[_OUTCOME_INDEX] == "Deceased":
                case["events"].append({
                    "name": "outcome",
                    "value": "Death",
                })
            elif row[_OUTCOME_INDEX] == "Hospitalized":
                case["events"].append({
                    "name": "hospitalAdmission",
                    "value": "Yes"
                })
            cases.append(case)
        return cases


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
