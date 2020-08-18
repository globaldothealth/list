import os
import sys
from datetime import date, datetime
import csv

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if ('lambda' not in sys.argv[0]):
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'common/python'))
import parsing_lib

_DATE_INDEX = 8
_AGE_INDEX = 4
_GENDER_INDEX = 5
_CONFIRMED_INDEX = 6

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
    if raw_gender == "W":
        return "Female"
    return None

def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        age_range = age.split('-')
        if len(age_range) > 1:
            demo["ageRange"] = {
                "start": float(''.join([x for x in age_range[0] if x.isdigit()])),
                "end": float(''.join([x for x in age_range[1] if x.isdigit()]))
            }
        else:
            demo["ageRange"] = {
                "start": float(''.join([x for x in age_range[0] if x.isdigit()])),
                "end": float(''.join([x for x in age_range[0] if x.isdigit()]))
            }
    return demo

def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        with open(raw_data_file, "r") as f:
            reader = csv.reader(f)
        next(reader) # Skip the header.
        cases = []
        for row in reader:
            num_confirmed_cases = int(row[_CONFIRMED_INDEX])
            if not num_confirmed_cases:
                continue
            try:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "demographics": convert_demographics(
                        row[_GENDER_INDEX], row[_AGE_INDEX]),
                }
                cases.extend([case] * num_confirmed_cases)
            except ValueError as ve:
                print(ve)
        return cases


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
