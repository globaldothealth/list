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

# Fixed location, all cases are for Estonia and no finer location is available in the source.
_LOCATION = {
    "country": "Estonia",
    "geoResolution": "Country",
    "name": "Estonia",
    "geometry": {
        "longitude": "25.7615268448868",
        "latitude": "58.7783968568071"
    }
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYY-mm-dd HH:MM:SS format (i.e.: 2020-03-06 18:44:00), but the date filtering API
    expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d %H:%M:%S")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender.upper() == "M":
        return "Male"
    elif raw_gender.upper() == "N":
        return "Female"
    elif raw_gender.upper() == "U":
        # Unknown
        return None
    else:
        raise ValueError(f'Unhandled gender: {raw_gender}')


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        # Brackets are like "35-39" or "over 85".
        if '-' in age:
            start, _, end = age.partition("-")
            demo["ageRange"] = {
                "start": float(start),
                "end": float(end),
            }
        elif age == "over 85":
            demo["ageRange"] = {
                "start": 85.0,
            }
        else:
            raise ValueError(f'Unhandled age: {age}')
    return demo or None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data."""
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        next(reader)  # Skip the header.
        for row in reader:
            # Skip negative cases.
            if row['ResultValue'] != "P":
                continue
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url,
                    "sourceEntryId": row["id"],
                },
                "location": _LOCATION,
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(row['ResultTime']),
                            "end": convert_date(row['ResultTime']),
                        },
                    },
                ],
                "demographics": convert_demographics(
                    row['Gender'], row['AgeGroup']),
                "notes": f"Case residence: {row['Country']} {row['County']}".strip(),
            }
            yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
