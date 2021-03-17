import json
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
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,os.pardir, 'common'))
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


def convert_date(year: str, week: str):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is given by year and week number, the date filtering API
    expects mm/dd/YYYYZ format so we use the first day of the given week.
    """
    date = datetime.fromisocalendar(int(year), int(week), 1)
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "M":
        return "Male"
    elif raw_gender == "F":
        return "Female"
    return None


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender.lower() != 'unbekannt':
        demo["gender"] = convert_gender(gender.upper())
    if age != 'unbekannt':
        # 100+
        if age.endswith("+"):
            demo["ageRange"] = {
                "start": float(age[:-1]),
                "end": 120,
            }
        # 45-55
        elif '-' in age:
            start, _, end = age.partition('-')
            demo["ageRange"] = {
                "start": float(start),
                "end": float(end),
            }
        # 42
        elif age.isalpha():
            demo["ageRange"] = {
                "start": float(age),
                "end": float(age),
            }
    return demo or None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.

    Some caveats:
        1. There are no patient ID/case ID in the raw API so we aren't able
           to dedupe.
        2. We can't link confirmed cases and confirmed deaths because of (1)
           so we're only importing confirmed cases and ignoring deaths.
        3. Granularity for cases is weekly, not daily so we use the first day of
           the given week arbitrarily.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            num_confirmed_cases = int(row['NewConfCases'])
            if not num_confirmed_cases:
                continue
            try:
                when = convert_date(row["Year"], row["Week"])
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
                                "start": when,
                                "end": when,
                            },
                        },
                    ],
                    "demographics": convert_demographics(
                        row['Gender'], row['AgeYearCat']),
                }
                for _ in range(num_confirmed_cases):
                    yield case
            except ValueError as ve:
                print(ve)



def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
