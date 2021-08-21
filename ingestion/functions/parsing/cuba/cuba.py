import os
import sys
import csv
import copy
from datetime import datetime
import json
from pathlib import Path

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

_PROVINCES = {}
_MUNICIPALITIES = {}
province_set = set()


def _drop_admin2(municipality_location):
    "Drops admin2 info and uses same data for province location"
    newloc = copy.deepcopy(municipality_location)
    newloc['name'] = newloc['administrativeAreaLevel1']
    del newloc['administrativeAreaLevel2']
    newloc['geoResolution'] = "Admin1"
    return newloc

# Geocoding data is from Wikipedia:
# Municipalities of Cuba,
# https://en.wikipedia.org/w/index.php?title=Municipalities_of_Cuba&oldid=1010874027
# (version as of 21 August 2021)

with (Path(__file__).parent / 'geocodes.csv').open() as geof:
    reader = csv.DictReader(geof)
    for r in reader:
        province_set.add(r['code_province'])
        _MUNICIPALITIES[r['code_municipality']] = {
            "name": r['municipality'],
            "administrativeAreaLevel1": r['province'],
            "administrativeAreaLevel2": r['municipality'],
            "country": "Cuba",
            "geoResolution": "Admin2",
            "geometry": {
                "latitude": float(r['latitude']),
                "longitude": float(r['longitude'])
            }
        }
        if r['province'] == r['municipality']:
            # Add to province map in case municipality doesn't exist
            _PROVINCES[r['code_province']] = {
                "name": r['province'],
                "administrativeAreaLevel1": r['province'],
                "country": "Cuba",
                "geoResolution": "Admin1",
                "geometry": {
                    "latitude": float(r['latitude']),
                    "longitude": float(r['longitude'])
                }
            }

    # For provinces without municipalities having the same name
    # assign the .01 municipality geocode to the province
    # As an example Villa Clara (26) will get assigned the
    # geocode of Corralillo (26.01)
    for p in province_set - set(_PROVINCES.keys()):
        _PROVINCES[p] = _drop_admin2(_MUNICIPALITIES[p + '.01'])


def convert_date(raw_date, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.
    Dates are listed in YYYY/mm/dd format
    """
    try:
        date = datetime.strptime(raw_date, "%Y/%m/%d")
        if not dataserver:
            return date.strftime("%m/%d/%Y")
        return date.strftime("%m/%d/%YZ")
    except BaseException:
        pass


def convert_gender(raw_gender):
    if raw_gender == "hombre":
        return "Male"
    if raw_gender == "mujer":
        return "Female"


def convert_location(raw_entry):
    code_municipality = raw_entry.get('dpacode_municipio_deteccion', None)
    code_province = raw_entry.get('dpacode_provincia_deteccion', None)
    try:
        if code_municipality:
            return _MUNICIPALITIES[code_municipality]
        if code_province:
            return _PROVINCES[code_province]
    except KeyError:
        print("Location not found:", raw_entry)
    return None


def convert_nationality(two_letter_country_code):
    if two_letter_country_code == 'cu':
        return "Cuban"
    else:
        try:
            return pycountry.countries.get(
                alpha_2=two_letter_country_code).name
        except BaseException:
            pass


def convert_demographics(raw_entry, case_keys):
    demo = {}
    if 'edad' in case_keys and raw_entry['edad']:
        demo["ageRange"] = {
            "start": float(
                raw_entry["edad"]),
            "end": float(
                raw_entry["edad"])}
    if 'sexo' in case_keys and raw_entry['sexo']:
        demo["gender"] = convert_gender(
            raw_entry["sexo"])
    if 'pais' in case_keys and raw_entry['pais']:
        demo["nationalities"] = [convert_nationality(raw_entry['pais'])]

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Nationality of case is provided in two letter country codes, so using pycountry package to parse these

    The field 'posible_procedencia_contagio' is generally populated by two letter country codes. Case is assumed to have travelled
    from one of these countries in last 30 days if populated.

    Diagnostic centre and treatment hospital are both included in notes for now, could be geocoded in future.

    Currently no parsing of symptoms, as field is always left empty - worth rechecking this in future in case this field
    becomes populated. No disease outcome data is provided either.

    """
    with open(raw_data_file, "r") as f:
        json_data = json.load(f)
        # First make dict mapping code names of diagnostic and treament centers
        # to actual locations
        hospital_map = {}
        for centre_type in ['centros_aislamiento', 'centros_diagnostico']:
            for centre in json_data[centre_type]:
                hospital_map[centre] = json_data[centre_type][centre]['nombre'] + \
                    ", " + json_data[centre_type][centre]['provincia']

        # Get schema_version
        schema_version = json_data['schema-version']
        if schema_version != 7:
            print(
                f'Schema version has been updated from 7 to {schema_version}')

        for day in json_data['casos']['dias']:
            if 'diagnosticados' in json_data['casos']['dias'][day]:
                fecha = json_data['casos']['dias'][day]['fecha']
                for entry in json_data['casos']['dias'][day]['diagnosticados']:
                    case_keys = entry.keys()
                    notes = []
                    if 'id' in entry:
                        case = {
                            "caseReference": {
                                "sourceId": source_id,
                                "sourceEntryId": entry["id"],
                                "sourceUrl": source_url},
                            "location": convert_location(entry),
                            "events": [
                                {
                                    "name": "confirmed",
                                    "dateRange": {
                                        "start": convert_date(fecha),
                                        "end": convert_date(fecha)}}]}

                        case["demographics"] = convert_demographics(
                            entry, case_keys)

                        if entry.get("consulta_medico", ""):
                            case["events"].append({
                                "name": "firstClinicalConsultation",
                                "dateRange": {
                                    "start": convert_date(entry["consulta_medico"]),
                                    "end": convert_date(entry["consulta_medico"])
                                }}
                            )

                        if entry.get('posible_procedencia_contagio', ""):
                            if 'crucero' in entry['posible_procedencia_contagio']:
                                case["transmission"] = {
                                    "places": "Cruise Ship"}

                            elif len(entry['posible_procedencia_contagio'][0]) == 2:
                                case["travelHistory"] = {
                                    "traveledPrior30Days": True,
                                    "travel": []
                                }
                                for two_letter_country_code in entry['posible_procedencia_contagio']:
                                    if len(two_letter_country_code) != 2:
                                        continue
                                    if pycountry.countries.get(
                                            alpha_2=two_letter_country_code):
                                        country = pycountry.countries.get(
                                            alpha_2=two_letter_country_code).name
                                        case["travelHistory"]["travel"].append({
                                            "location": parsing_lib.geocode_country(two_letter_country_code)
                                        })
                                        if arrival_date := entry.get('arribo_a_cuba_foco', ""):
                                            notes.append(
                                                f"Case arrived in Cuba from {country} on {convert_date(arrival_date)}")

                        if entry.get('contagio', "") == 'introducido':
                            notes.append(
                                "Case was transmitted from another confirmed case within Cuba.")
                        elif entry.get('contagio', "") == 'importado':
                            notes.append(
                                "Case was contracted abroad and brought into Cuba.")

                        if '-1' in entry['id']:
                            notes.append(
                                "First patient from this country in Cuba.")

                        if entry.get("centro_diagnostico", ""):
                            notes.append(
                                f"Case diagnostic test was performed at {hospital_map.get(entry['centro_diagnostico'],'Unknown Centre')}.")
                        if entry.get("centro_aislamiento", ""):
                            notes.append(
                                f"Case was treated at {hospital_map.get(entry['centro_aislamiento'],'Unknown Hospital')}.")

                        if entry.get("contacto_focal", ""):
                            notes.append(
                                f"A further {entry['contacto_focal']} people who this case was in contact with are being monitored for symptoms")

                        if 'info' in case_keys and entry['info']:
                            notes.append(
                                f"Notes provided are as follows: \n {entry['info']}")

                        notes.append(f'Using schema version {schema_version}')

                        case["notes"] = ",".join(notes)

                        yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
