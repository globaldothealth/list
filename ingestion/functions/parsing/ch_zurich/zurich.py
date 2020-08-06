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

# Fixed location, all cases are for the canton of Zurich in Switzerland.
_LOCATION = {
    "country": "Switzerland",
    "administrativeAreaLevel1": "Zurich",
    "geoResolution": "Admin1",
    "name": "Zurich canton",
    "geometry": {
        "longitude": "8.651071",
        "latitude": "47.42568"
    }
}

_DATE_INDEX = 0
_AGE_INDEX = 2
_GENDER_INDEX = 3
_CONFIRMED_INDEX = 4
_SOURCE_INDEX = 6

def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYY-mm-dd format, but the data server API will
    assume that ambiguous cases (e.g. "05/06/2020") are in mm/dd/YYYY format.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d")
    return date.strftime("%m/%d/%YZ")

def convert_gender(raw_gender: str):
    if raw_gender.upper() == "M":
        return "Male"
    elif raw_gender.upper() == "F":
        return "Female"
    return None

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Some caveats:
        1. There are no patient ID/case ID in the raw API so we aren't able
           to dedupe.
        2. We can't link confirmed cases and confirmed deaths because of (1)
           so we're only importing confirmed cases and ignoring deaths.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.reader(f)
        next(reader) # Skip the header.
        cases = []
        for row in reader:
            num_cases = int(row[_CONFIRMED_INDEX])
            if not num_cases:
                continue
            try:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "location": _LOCATION,
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange":
                            {
                                "start": convert_date(row[_DATE_INDEX]),
                                "end": convert_date(row[_DATE_INDEX]),
                            },
                        },
                    ],
                    "demographics": {
                        "gender": convert_gender(row[_GENDER_INDEX]),
                    }
                }
                if row[_AGE_INDEX]:
                    case["demographics"]["ageRange"] = {
                        "start": float(row[_AGE_INDEX]),
                        "end": float(row[_AGE_INDEX]),
                    }
                cases.extend([case] * num_cases)
            except ValueError as ve:
                print(ve)
        return cases

def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)