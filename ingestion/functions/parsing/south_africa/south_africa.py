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
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,os.pardir, 'common'))
    import parsing_lib


_UUID = "case_id"
_AGE = "age"
_GENDER = "gender"
_PROVINCE = "province/state"
_COUNTRY = "country"
_DATE_CONFIRMED = "date"
_SOURCE = "source"
_TRAVEL = "travel_history_location"

_PROVINCE_MAP = {
    "KZN": "KwaZulu-Natal",
    "GP": "Gauteng",
    "WC": "Western Cape",
    "MP": "Mpumalanga",
    "LP": "Limpopo",
    "FS": "Free State",
    "EC": "Eastern Cape",
    "NC": "Northern Cape",
    "NW": "North West"
}


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
    if raw_gender == "male":
        return "Male"
    if raw_gender == "female":
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


def convert_location(province: str):
    if province:
        # UNK is not a recognized South African province, probably means 'unknown'
        if province != "UNK":
            return ", ".join([_PROVINCE_MAP[province], "South Africa"])
        else:
            return "South Africa"
    else:
        return "South Africa"


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    return demo


def convert_additional_sources(additional_source_url: str):
    if additional_source_url:
        return [{"sourceUrl": additional_source_url}]


def convert_travel(travel_history: str):
    # United States entered as US, USA and Unites States of America
    # United Kingdom entered as UK and United Kingdom
    travel = []
    # UK is not an entry in the pycountry dict so has to be dealt with separately
    if "UK" in travel_history:
        travel_history = travel_history.replace("UK", "United Kingdom")
    for country in list(pycountry.countries):
        if country.name in travel_history or country.alpha_3 in travel_history:
            # Otherwise this returns Republic of the Congo which is the wrong country
            if country.name == "Congo":
                travel.append({"location": {"query": "Congo, The Democratic Republic of the"}})
            else:
                travel.append({"location": {"query": country.name}})
    if "Dubai" in travel_history:
        travel.append({"location": {"query": "Dubai, United Arab Emirates"}})
    if travel:
        return {"traveledPrior30Days": True,
                "travel": travel}


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.

    Please note that this data was last updated in May 2020.

    This parser only deals with the columns where there was any data at the time of writing.
    Several columns with potentially useful information (e.g. date_onset_symptoms) are unpopulated for all cases.
    Would be worth keeping an eye on the data to see whether (a) it starts getting updated again and (b) whether this will lead to any new information provided at which point the parser will need to be expanded to deal with this.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            if row[_COUNTRY] == "South Africa":
                try:
                    case = {
                        "caseReference": {
                            "sourceId": source_id,
                            "sourceEntryId": row[_UUID],
                            "sourceUrl": source_url,
                            "additionalSources": convert_additional_sources(row[_SOURCE])
                        },
                        "location": {
                            "query": convert_location(row[_PROVINCE])
                        },
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE]
                        ),
                        "events": convert_events(
                            row[_DATE_CONFIRMED]
                        ),
                        "travelHistory": convert_travel(row[_TRAVEL])
                    }
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")



def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)