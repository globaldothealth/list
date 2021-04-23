import os
import sys
from datetime import datetime
import csv
import json

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


_DATE_INDEX = "Meldedatum"
_AGE_INDEX = "Altersgruppe"
_GENDER_INDEX = "Geschlecht"
_CASECOUNT = "AnzahlFall"
_DEATHCOUNT = "AnzahlTodesfall"
_RECOVERYCOUNT = "NeuGenesen"
_ADMIN1 = "Bundesland"
_ADMIN3_ID = "IdLandkreis"
_DATE_ONSET_SYMPTOMS = "Refdatum"
_ONSET_DATE_PROVIDED = "IstErkrankungsbeginn"

# The German admin3 entries are very often not accepted by mapbox and so need to be cross-referenced with data from Nationale Plattform für geographische Daten (https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/esri-de-content::kreisgrenzen-2019) to extract longitude and latitude information.
# This way we can collect geographic information down to admin level 3 but without relying on mapbox
# This data has been collated into two dictionaries
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dictionaries.json")) as json_file:
    dictionaries = json.load(json_file)

_LOCATION_ID_MAP = dictionaries["name_id_dict"]

_LOCATION_LAT_LONG_MAP = dictionaries["id_long_lat_dict"]


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    date = datetime.strptime(raw_date.split(" ")[0], "%Y/%m/%d")
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


def convert_location(admin1, admin3_id):
    location = {}
    geometry = {}
    # Some entries have leading zeros which are not recognized
    admin3_id = (admin3_id[1:] if admin3_id.startswith('0') else admin3_id)
    if admin3_id in _LOCATION_ID_MAP.keys():
        # Matching by ID rather than name is more robust to things like formatting differences or slight differences in spelling/abbreviation
        location["administrativeAreaLevel3"] = _LOCATION_ID_MAP[admin3_id]
        location["country"] = "Germany"
        location["administrativeAreaLevel1"] = admin1
        location["geoResolution"] = "Point"
        location["name"] = ", ".join([_LOCATION_ID_MAP[admin3_id], admin1, "Germany"])
        
        geometry["latitude"] = _LOCATION_LAT_LONG_MAP[admin3_id]["latitude"]
        geometry["longitude"] = _LOCATION_LAT_LONG_MAP[admin3_id]["longitude"]
        location["geometry"] = geometry
    else:
        # Some entries are still not recognized and will therefore be geocoded at admin1 level. 
        # In e2e testing these were limited to the subdivisions of Berlin which are officially admin level 2 and so where not present in the source data used.
        print(f'Unknown administrative district: {admin3_id}')
        location["query"] = ", ".join([admin1, "Germany"])
    if location:
        return location
    else:
        return None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            num_confirmed_cases = int(row[_CASECOUNT])
            if num_confirmed_cases < 1:
                continue
            try:
                case = {
                    "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                    "location": convert_location(row[_ADMIN1], row[_ADMIN3_ID]),
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
                if int(row[_ONSET_DATE_PROVIDED]) == 1:
                    case["events"].append({
                        "name": "onsetSymptoms",
                        "dateRange":
                        {
                            "start": convert_date(row[_DATE_ONSET_SYMPTOMS]),
                            "end": convert_date(row[_DATE_ONSET_SYMPTOMS])
                        }
                    })
                for _ in range(num_confirmed_cases):
                    yield case
            except ValueError as ve:
                raise ValueError("Unhandled data: {}".format(ve))



def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
