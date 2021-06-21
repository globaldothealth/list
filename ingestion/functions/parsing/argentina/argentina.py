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
            os.pardir, os.pardir, 'common'))
    import parsing_lib


# The location data for Argentinian cases is obtained by using a lookup table (from https://datos.gob.ar/dataset/ign-unidades-territoriales/archivo/ign_01.03.02) which allows for cross-referencing of location down to administrative level 2 and latitude/longitude
# This data has been collated into several dictionaries: 
# "mismatch_locations" has entries where the spelling in the case data and the lookup table differs
# "department_lat_long" has information from source regarding longitude/latitude of administrative level 2 locations
# "province_lat_long" has information from source regarding longitude/latitude of administrative level 1 locations
# "country_iso2" maps Spanish country names to their ISO-2 codes, and also includes common alternative spellings of country names as observed in data (e.g. lack of accents, common typos)
# 'country_translate_lat_long' maps country ISO-2 codes to longitude/latitude of country centroids, obtained from https://raw.githubusercontent.com/google/dspl/master/samples/google/canonical/countries.csv, as well as the corresponding country name in English
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dictionaries.json"), encoding='utf-8') as json_file:
    dictionaries = json.load(json_file)

_MISMATCH_LOCATIONS = dictionaries["mismatch_locations"]

_DEPARTMENT_LAT_LONG_MAP = dictionaries["department_lat_long"]

_PROVINCE_LAT_LONG_MAP = dictionaries["province_lat_long"]

_COUNTRY_ISO2_MAP = dictionaries["country_iso2"]

_COUNTRY_LAT_LONG_MAP = dictionaries['country_translate_lat_long']

private_public_map = {'Público': 'Public', 'Privado': 'Private'}


def convert_date(date_str: str):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYY-mm-dd format
    """
    date = datetime.strptime(date_str, "%Y-%m-%d")

    return date.strftime("%m/%d/%Y")


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"


def convert_location(entry):
    '''
    This gets the residential address of the patient, which is given to administrative level 2 in most cases.
    When it is not, we default to the administrative level 1 residence data.
    In some cases, residence of patient is reported as outside Argentina, or residence location is not reported at all; in these cases the case location to administrative level 1 ('carga_provincia_nombre') is used to provide location information.
    '''
    location = {}
    geometry = {}
    country = entry["residencia_pais_nombre"]
    admin1 = entry["residencia_provincia_nombre"]
    admin1_case = entry['carga_provincia_nombre']
    admin2 = entry["residencia_departamento_nombre"]
    # Deal with cases where the spelling of the administrative level 2 or 1 locations do not exactly match official source of latitude/longitude data
    if admin2 in _MISMATCH_LOCATIONS.keys():
        admin2 = _MISMATCH_LOCATIONS[admin2]
    if admin1 in _MISMATCH_LOCATIONS.keys():
        admin1 = _MISMATCH_LOCATIONS[admin1]
    if admin1_case in _MISMATCH_LOCATIONS.keys():
        admin1_case = _MISMATCH_LOCATIONS[admin1_case]

    if country == 'Argentina':
        if admin2 in _DEPARTMENT_LAT_LONG_MAP.keys():
            location["administrativeAreaLevel2"] = admin2
            location["country"] = country
            location["administrativeAreaLevel1"] = admin1
            location["geoResolution"] = "Admin2"
            location["name"] = ", ".join([admin2, admin1, country])
            
            geometry["latitude"] = _DEPARTMENT_LAT_LONG_MAP[admin2]["latitude"]
            geometry["longitude"] = _DEPARTMENT_LAT_LONG_MAP[admin2]["longitude"]
            location["geometry"] = geometry
        elif admin1 in _PROVINCE_LAT_LONG_MAP.keys():
            location["country"] = country
            location["administrativeAreaLevel1"] = admin1
            location["geoResolution"] = "Admin1"
            location["name"] = ", ".join([admin1, country])
            
            geometry["latitude"] = _PROVINCE_LAT_LONG_MAP[admin1]["latitude"]
            geometry["longitude"] = _PROVINCE_LAT_LONG_MAP[admin1]["longitude"]
            location["geometry"] = geometry
        else:
            # In the case of neither administrative level 1 or 2 information provided, default to country information.
            location["country"] = country
            location["geoResolution"] = "Country"
            location["name"] = country
            
            Argentina_ISO2 = _COUNTRY_ISO2_MAP[country.lower()]
            geometry["latitude"] = _COUNTRY_LAT_LONG_MAP[Argentina_ISO2]["latitude"]
            geometry["longitude"] = _COUNTRY_LAT_LONG_MAP[Argentina_ISO2]["longitude"]
            location["geometry"] = geometry
    else:
        # This encompasses both cases where country == 'SIN ESPECIFICAR' or where country of residence is other than Argentina
        # In these cases the case location to administrative level 1 (which is always an Argentinian province) is used for location information
        if admin1_case in _PROVINCE_LAT_LONG_MAP.keys():
            location["country"] = "Argentina"
            location["administrativeAreaLevel1"] = admin1_case
            location["geoResolution"] = "Admin1"
            location["name"] = ", ".join([admin1_case, "Argentina"])
            
            geometry["latitude"] = _PROVINCE_LAT_LONG_MAP[admin1_case]["latitude"]
            geometry["longitude"] = _PROVINCE_LAT_LONG_MAP[admin1_case]["longitude"]
            location["geometry"] = geometry
    if location:
        return location
    else:
        return None


def convert_travel(entry):
    '''
    When the residence location is a country other than Argentina we assume travel history.
    '''
    if entry not in ["Argentina", "SIN_ESPECIFICAR", "SIN ESPECIFICAR"]:
        location = {}
        geometry = {}
        travel = {}
        travel_countries = []
        country = entry

        if country.lower() in _COUNTRY_ISO2_MAP:
            country_ISO2 = _COUNTRY_ISO2_MAP[country.lower()]

            location["country"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["name_english"]
            location["geoResolution"] = "Country"
            location["name"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["name_english"]
            geometry["latitude"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["latitude"]
            geometry["longitude"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["longitude"]
            location["geometry"] = geometry

            travel_countries.append({"location": location})
        else:
            print(f"Country code not found for: {country.lower()}")
        travel["traveledPrior30Days"] = True
        travel["travel"] = travel_countries
        if travel:
            return travel
        else:
            return None


def convert_age(entry):
    '''
    Want to return a float specifying age in years. If age field is empty, return None
    '''
    if entry['edad']:
        if int(entry['edad']) < 121:
            if entry['edad_años_meses'] == 'Años':
                return float(entry['edad'])
            elif entry['edad_años_meses'] == 'Meses':
                return float(entry['edad']) / 12
    return None


def get_confirmed_event(entry):
    if entry['fecha_diagnostico']:
        confirmation_date = convert_date(entry['fecha_diagnostico'])
        note = 'Using Date of Diagnosis as the date of confirmation.'

    elif entry['fecha_inicio_sintomas']:
        confirmation_date = convert_date(entry['fecha_inicio_sintomas'])
        note = 'Using Date of Symptom Onset as the date of confirmation, because Date of Diagnosis is missing.'

    elif entry['fecha_apertura']:
        confirmation_date = convert_date(entry['fecha_apertura'])
        note = 'Using Date of Case Opening as the date of confirmation, because both Date of Diagnosis and Date of Symptom Onset are missing.'

    if 'Caso confirmado por laboratorio' in entry['clasificacion']:
        confirmed_value = 'Laboratory Test'
    elif 'Caso confirmado por criterio clínico-epidemiológico' in entry['clasificacion']:
        confirmed_value = 'Clinical Diagnosis'
    else:
        confirmed_value = 'Method Unknown'

    confirmed_event = {
        "name": "confirmed",
        "value": confirmed_value,
        "dateRange":
        {
            "start": confirmation_date,
            "end": confirmation_date
        }}

    return confirmed_event, note


def convert_case_location(entry):
    '''
    Additional information is provided regarding where case was diagnosed/hospitalised, but to less detail than residential location.
    '''
    if entry['carga_provincia_nombre']:
        return ", ".join([entry.get("carga_provincia_nombre", ""), "Argentina"])
    else:
        return "NOT REPORTED"


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    We are currently only incorporating cases classified ('clasificacion_resumen') as 'Confirmed'. However,
    970k out of 1.5M cases are listed as 'Discarded', even though many have data values resembling confirmed
    Covid-19 patients, eg date_of_diagnosis, ICU_admission, mechanical breathing assistance. Future versions may
    want to modify this behaviour.

    For cases classified as Confirmed but lacking a Date of Diagnosis, we use Date of Symptom onset where present,
    and Date of Case Opening where neither Date of Diagnosis or Date of Symptom Onset are present.

    For case location, we use the residential address of the patient, as this gives more detailed location information (to department level)
    than 'carga_provincia_nombre' (== location where test was carried out, given to province level).

    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            notes = []
            if entry["clasificacion_resumen"] == "Confirmado":
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceEntryId": entry["id_evento_caso"],
                        "sourceUrl": source_url
                    },
                    "location": convert_location(entry),
                    "demographics": {
                        "ageRange": {
                            "start": convert_age(entry),
                            "end": convert_age(entry)
                        },
                        "gender": convert_gender(entry["sexo"])
                    }
                }

                confirmed_event, confirmation_note = get_confirmed_event(entry)
                case["events"] = [confirmed_event]
                notes.append(confirmation_note)

                if entry["fecha_inicio_sintomas"]:
                    case["symptoms"] = {
                        "status": "Symptomatic",
                    }
                    case["events"].append({
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": convert_date(entry['fecha_inicio_sintomas']),
                            "end": convert_date(entry['fecha_inicio_sintomas']),
                        }
                    })

                if entry["fecha_fallecimiento"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "Death",
                        "dateRange": {
                            "start": convert_date(entry['fecha_fallecimiento']),
                            "end": convert_date(entry['fecha_fallecimiento']),
                        }
                    })
                elif entry["fecha_internacion"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "hospitalAdmission",
                        "dateRange": {
                            "start": convert_date(entry['fecha_internacion']),
                            "end": convert_date(entry['fecha_internacion']),
                        }
                    })
                elif entry["fecha_cui_intensivo"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "icuAdmission",
                        "dateRange": {
                            "start": convert_date(entry['fecha_cui_intensivo']),
                            "end": convert_date(entry['fecha_cui_intensivo']),
                        }
                    })

                if 'no activo' in entry['clasificacion'].lower():
                    case["events"].append({
                        "name": "outcome",
                        "value": "Recovered"})
                    if 'No activo (por tiempo de evolución)' in entry['clasificacion']:
                        notes.append(
                            "Patient recovery was confirmed by a number of days elapsing with no symptoms.")
                    elif "No Activo por criterio de laboratorio" in entry['clasificacion']:
                        notes.append(
                            "Patient recovery was confirmed by a negative laboratory test.")
                
                travel_history = convert_travel(entry["residencia_pais_nombre"])
                case['travelHistory'] = travel_history

                notes.append(
                    f"Province in charge of case reported as {convert_case_location(entry)}.")
                notes.append(
                    f"Case last updated on {convert_date(entry['ultima_actualizacion'])}.")
                if entry['origen_financiamiento'] in ['Público', 'Privado']:
                    notes.append(
                        f"Case was dealt with through {private_public_map[entry['origen_financiamiento']]} health system.")

                if entry['asistencia_respiratoria_mecanica'] == 'SI':
                    notes.append("Patient received mechanical ventilation.")
                if entry['clasificacion']:
                    notes.append(f"Diagnostic notes: {entry['clasificacion']}")

                case["notes"] = ", ".join(notes)
                yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)


if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
