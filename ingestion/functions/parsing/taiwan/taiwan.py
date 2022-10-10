import os
import sys
import csv
import json
from datetime import datetime
from pathlib import Path
import common.ingestion_logging as logging

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

logger = logging.getLogger(__name__)

TAIWAN_LOCATION = {
    "country": "Taiwan",
    # Go to wikipedia to debate please, thank you.
    "geoResolution": "Country",
    "name": "Taiwan",
    "geometry": {
        "longitude": float("120.930229378541"),
        "latitude": float("23.7779779950014")
    }
}

# Geocode data © OpenStreetMap contributors https://www.openstreetmap.org/copyright
with (Path(__file__).parent / 'geocodes.json').open() as geof:
    _GEOCODES = json.load(geof)

def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    Date filtering API expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date, "%Y/%m/%d")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "男":
        return "Male"
    elif raw_gender == "女":
        return "Female"
    elif raw_gender == "第三性":
        return "Non-binary/Third gender"
    elif raw_gender == "性別不詳":
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
                "start": int(start),
                "end": int(end),
            }
        elif age.isdigit():
            demo["ageRange"] = {
                "start": int(age),
                "end": int(age),
            }
        elif age == "70+":
            demo["ageRange"] = {
                "start": 70,
                "end": 120,
            }
        else:
            raise ValueError(f'Unhandled age: {age}')
    return demo or None


def convert_immigration(immigration_status: str):
    return ({"traveledPrior30Days": True} if immigration_status == "是"
        else None)


def convert_location(location):
    if location == '空值':  # means 'empty value', not a city
        return TAIWAN_LOCATION
    try:
        return _GEOCODES[location]
    except KeyError:
        logger.error(f"Location not found: {location}")
        return None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data.
    Remarks: No per-case ID is available so we can't dedupe cases.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url,
                },
                "location": convert_location(row['縣市']),
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(row['個案研判日']),
                            "end": convert_date(row['個案研判日']),
                        },
                    },
                ],
                "demographics": convert_demographics(
                    # Sex.
                    row['性別'],
                    # Age range.
                    row['年齡層']),
                "travelHistory": convert_immigration(row["是否為境外移入"]),
            }
            # Number of cases that this row represents.
            for _ in range(int(row["確定病例數"])):
                yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
