import os
import sys
from datetime import datetime
import csv
import json
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

# To geocode cases for Peru, we load dictionaries to map place names to coordinates. These are from ESRI Peru lookup table
# Case locations are provided as District, Province, Department. For a subset of cases, only Department is specified.
# place_coords_dict maps place names in the format District, Province, Department to coordinates, based on string matching from the lookup table.
# place_capital_coords_dict does the same except for capitals of provinces, which are recorded differently.
# If only the department is specified, department_coords_dict is used to
# give the centroid of that department

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "geocoding_dictionaries.json")) as json_file:
    geocoding_dictionaries = json.load(json_file)


place_coords_dict = geocoding_dictionaries['place_coords_dict']
place_capital_coords_dict = geocoding_dictionaries['place_capital_coords_dict']
department_coords_dict = geocoding_dictionaries['department_coords_dict']


def convert_date(raw_date: str):
    """
    Convert raw date field into a value interpretable by the dataserver.
    The date is listed in YYYYmmdd format, but the data server API will
    assume that ambiguous cases (e.g. "05/06/2020") are in mm/dd/YYYY format.
    """
    date = datetime.strptime(raw_date, "%Y%m%d")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "MASCULINO":
        return "Male"
    if raw_gender == "FEMENINO":
        return "Female"
    return None


def get_location(row, first_dict_places, capital_dict_places):
    location = {}
    place_list = [row['DISTRITO'], row['PROVINCIA'], row['DEPARTAMENTO']]
    if place_list[2] == 'LIMA REGION':
        place_list[2] = 'LIMA'
    place_name = ", ".join(place_list)
    try:
        if place_list[0] != 'EN INVESTIGACIÓN':
            location["administrativeAreaLevel3"] = place_list[0]
            location["administrativeAreaLevel2"] = place_list[1]
            location["administrativeAreaLevel1"] = place_list[2]
            location["country"] = "Peru"
            location['geoResolution'] = "Admin3"
            location["name"] = place_name + ', Peru'
            if place_name in first_dict_places:
                coords = place_coords_dict[place_name]
            elif place_name in capital_dict_places:
                coords = place_capital_coords_dict[place_name]
        else:
            location["administrativeAreaLevel1"] = place_list[2]
            location["country"] = "Peru"     
            location["name"] = place_list[2] + ', Peru'
            location['geoResolution'] = "Admin1"
            coords = department_coords_dict[place_list[2]]

        geometry = {'latitude': coords[1],
                    'longitude': coords[0]}

        location["geometry"] = geometry

        return location
    except Exception as e:
        logger.error(place_name)
        return None


def convert_demographics(age: str, sex: str):
    demo = {}
    if age:
        if float(age) < 120:
            demo["ageRange"] = {
                "start": float(age),
                "end": float(age)
            }
    if sex:
        demo["gender"] = convert_gender(sex)
    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    Creates a dict to map type of confirming diagnostic test from Spanish abbreviation to English.
    Assuming PR = prueba rapida (rapid serological test) and PCR = PCR test
    """
    first_dict_places = place_coords_dict.keys()
    capital_dict_places = place_capital_coords_dict.keys()
    conf_methods = {
        'PR': 'Serological test',
        'PCR': 'PCR test'
    }
    with open(raw_data_file, "r", encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for entry in reader:
            if entry["UUID"] and entry['FECHA_RESULTADO']:
                location = get_location(
                    entry, first_dict_places, capital_dict_places)
                if location:
                    case = {
                        "caseReference": {
                            "sourceId": source_id,
                            "sourceUrl": source_url},
                        "location": location,
                        "events": [
                            {
                                "name": "confirmed",
                                "value": conf_methods.get(
                                    entry['METODODX']),
                                "dateRange": {
                                    "start": convert_date(
                                        entry["FECHA_RESULTADO"]),
                                    "end": convert_date(
                                        entry["FECHA_RESULTADO"])}}],
                        "demographics": convert_demographics(
                            entry["EDAD"],
                            entry["SEXO"]),
                    }
                    yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
