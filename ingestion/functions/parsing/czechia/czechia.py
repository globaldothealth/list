import os
import sys
from datetime import datetime
import csv
import pycountry

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import parsing_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "common/python"))
    import parsing_lib

_AGE = "vek"
_GENDER = "pohlavi"
_DATE_CONFIRMED = "datum"
_REGION = "kraj_nuts_kod"
_DISTRICT = "okres_lau_kod"
_TRAVEL_YN = "nakaza_v_zahranici"
_TRAVEL_LOCATION = "nakaza_zeme_csu_kod"


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    try:
        date = datetime.strptime(raw_date, "%Y-%m-%d")
        return date.strftime("%m/%d/%YZ")
    except:
        return None


def convert_gender(raw_gender: str):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "Z":
        return "Female"


def convert_events(date_confirmed):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed)
            }
        }
    ]
    return events


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    return demo


def convert_location(region, district):
    # Both the regions and districts are entered in a slighty altered ISO 3166-2 format, where the '-' is replaced with a '0'
    location = []
    if district:
        district = district.replace("0", "-", 1)
        for region_district in list(pycountry.subdivisions.get(country_code="CZ")):
            if region_district.code == district:
                location.append(region_district.name)
    if region:
        region = region.replace("0", "-", 1)
        for region_district in list(pycountry.subdivisions.get(country_code="CZ")):
            if region_district.code == region:
                location.append(region_district.name)
    if location:
        location.append("Czech Republic")
        return ", ".join(location)
    else:
        return "Czech Republic"


def convert_travel(travel_yn, travel_history: str):
    travel = {}
    if travel_yn == "1":
        travel["traveledPrior30Days"] = True
    if travel_history:
        travel_countries = []
        for country in list(pycountry.countries):
            if country.alpha_2 in travel_history:
                travel_countries.append({"location": {"query": country.name}})
        travel["travel"] = travel_countries
    if travel:
        return travel
    else:
        return None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            try:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "location": {
                        "query": convert_location(row[_REGION], row[_DISTRICT])
                    },
                    "demographics": convert_demographics(
                        row[_GENDER], row[_AGE]
                    ),
                    "events": convert_events(
                        row[_DATE_CONFIRMED]
                    ),
                    "travelHistory": convert_travel(row[_TRAVEL_YN], row[_TRAVEL_LOCATION])
                }
                yield case
            except ValueError as ve:
                raise ValueError(f"error converting case: {ve}")


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)