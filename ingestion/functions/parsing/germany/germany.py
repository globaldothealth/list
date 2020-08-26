import os
import sys
from datetime import date, datetime
import csv

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if "lambda" not in sys.argv[0]:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "common/python"
        )
    )
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
    return None


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        age_range = age.split("-")
        if len(age_range) > 1:
            demo["ageRange"] = {
                "start": float("".join([x for x in age_range[0] if x.isdigit()])),
                "end": float("".join([x for x in age_range[1] if x.isdigit()])),
            }
        else:
            demo["ageRange"] = {
                "start": float("".join([x for x in age_range[0] if x.isdigit()])),
                "end": float("".join([x for x in age_range[0] if x.isdigit()])),
            }
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
                        "country": "Germany",
                        "administrativeAreaLevel1": row[_ADMIN1],
                        "administrativeAreaLevel2": row[_ADMIN2],
                        "geoResolution": "Admin2",
                        "name": row[_ADMIN2],
                        "query": ", ".join(("Germany", row[_ADMIN1], row[_ADMIN2])),
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
                    case["events"].append({"name": "outcome", "value": "Death"})
                if int(row[_RECOVERYCOUNT]) > 0:
                    case["events"].append({"name": "outcome", "value": "Recovered"})
                cases.extend([case] * num_confirmed_cases)
            except ValueError as ve:
                print(ve)
        return cases


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
