import json
import os
import sys
import csv
from pathlib import Path
from datetime import datetime

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

_CZ = parsing_lib.geocode_country('CZ')

_AGE = "vek"
_GENDER = "pohlavi"
_DATE_CONFIRMED = "datum"
_REGION = "kraj_nuts_kod"
_DISTRICT = "okres_lau_kod"
_TRAVEL_YN = "nakaza_v_zahranici"
_TRAVEL_LOCATION = "nakaza_zeme_csu_kod"

_GENDER_MAP = {"M": "Male", "Z": "Female"}

# Geocode data © OpenStreetMap contributors https://www.openstreetmap.org/copyright
with (Path(__file__).parent / 'geocodes.json').open() as geof:
    _GEOCODES = json.load(geof)


def convert_date(raw_date):
    "Convert raw date field into a value interpretable by the dataserver"
    try:
        return datetime.fromisoformat(raw_date).strftime("%m/%d/%YZ")
    except ValueError:
        return None


def convert_events(date_confirmed):
    return [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed)
            }
        }
    ]


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = _GENDER_MAP.get(gender, None)
    if age:
        demo["ageRange"] = {"start": int(age), "end": int(age)}
    return demo


def convert_location(region, district):
    # Both the regions and districts are entered in a slighty
    # altered ISO 3166-2 format, where the '-' is replaced with a '0'
    # Try locations in these order, falling back to country geocoding
    return (
        _GEOCODES.get(district.replace("0", "-", 1), None)
        or _GEOCODES.get(region.replace("0", "-", 1), None)
        or _CZ
    )


def convert_travel(travel_yn, travel_history: str):
    if travel_yn == "1":
        travel = {"traveledPrior30Days": True}
    else:
        return None
    if travel_history:
        if travel_history in parsing_lib.COUNTRY_ISO2:
            travel["travel"] = [
                {"location": parsing_lib.geocode_country(travel_history)}
            ]
        else:
            travel["travel"] = []
    return travel or None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            confirmation_date = convert_date(row[_DATE_CONFIRMED])
            if confirmation_date is not None:
                try:
                    case = {
                        "caseReference": {
                            "sourceId": source_id,
                            "sourceUrl": source_url
                        },
                        "location": convert_location(row[_REGION], row[_DISTRICT]),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE]
                        ),
                        "events": convert_events(row[_DATE_CONFIRMED]),
                        "travelHistory": convert_travel(row[_TRAVEL_YN], row[_TRAVEL_LOCATION])
                    }
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")

def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
