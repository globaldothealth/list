import os
import sys
from datetime import date, datetime
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

_DATE_INDEX = 8
_AGE_INDEX = 4
_GENDER_INDEX = 5
_CASECOUNT = 6
_DEATHCOUNT = 7
_RECOVERYCOUNT = 15
_ADMIN1 = 2
_ADMIN2 = 3


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    date = datetime.strptime(raw_date, "%Y/%m/%d %H:%M:%S")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "W":
        return "Female"


def convert_age(age: str):
    """
    Convert age string.
    All age ranges in format AXX-AXX with X = numeric.
    Exception: A80+
    """
    age_range = age.split("-")
    if len(age_range) > 1:
        return {
            "start": float(age_range[0][1:3]),
            "end": float(age_range[1][1:3]),
        }
    else:
        return {
            "start": 80.0,
            "end": 120.0,
        }


def convert_demographics(gender: str, age: str):
    if not gender and not age:
        return None
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        demo["ageRange"] = convert_age(age)
    return demo


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.reader(f)
        next(reader)  # Skip the header.
        cases = []
        for row in reader:
            num_confirmed_cases = int(row[_CASECOUNT])
            if num_confirmed_cases < 1:
                continue
            try:
                case = {
                    "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                    "location": {
                        "query": ", ".join(("Germany", row[_ADMIN1], row[_ADMIN2])),
                        "limitToResolution": "Admin2",
                    },
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange": {
                                "start": convert_date(row[_DATE_INDEX]),
                                "end": convert_date(row[_DATE_INDEX]),
                            },
                        },
                    ],
                    "demographics": convert_demographics(
                        row[_GENDER_INDEX], row[_AGE_INDEX]
                    ),
                }
                # Death and recovery counts are always equal to case counts for the row.
                if int(row[_DEATHCOUNT]) > 0:
                    case["events"].append(
                        {"name": "outcome", "value": "Death"})
                elif int(row[_RECOVERYCOUNT]) > 0:
                    case["events"].append(
                        {"name": "outcome", "value": "Recovered"})
                for _ in range(num_confirmed_cases):
                    yield case
            except ValueError as ve:
                raise ValueError("Unhandled data: {}".format(ve))


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
