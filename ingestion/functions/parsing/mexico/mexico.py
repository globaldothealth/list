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



with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dictionaries.json"), encoding='utf-8') as json_file:
    maps = json.load(json_file)

_COMORBIDITIES_DICT = maps["comorbidities"]

_STATES = maps["states"]

_MUNICIPALITIES = maps["municipalities"]

_MUNICIPALITY_COORD = maps["municipality_coords"]

def convert_location(state_code: str, municipality_code: str):
    """
    Convert state and municipality codes into location query.
    """
    query_list = []
    missing_value_prefix = "9"
    if municipality_code[0] != missing_value_prefix:
        try:
            query_list.append(_MUNICIPALITIES[state_code + municipality_code])
        except KeyError:
            print(f"Municipality code missing: {municipality_code}")
    if state_code[0] != missing_value_prefix:
        try:
            query_list.append(_STATES[state_code])
        except KeyError:
            print(f"State Code Missing: {state_code}")
    query_string = ", ".join(query_list + ["MÉXICO"])
    try:
        municipality_code = state_code + municipality_code
        return {
            "administrativeAreaLevel1": _STATES[state_code],
            "administrativeAreaLevel2": _MUNICIPALITIES[municipality_code],
            "administrativeAreaLevel3": _MUNICIPALITIES[municipality_code],
            "geoResolution": "Admin2",
            "country": "Mexico",
            "name": query_string,
            "geometry": {
                "latitude": _MUNICIPALITY_COORD[municipality_code]["latitude"],
                "longitude": _MUNICIPALITY_COORD[municipality_code]["longitude"]
            }
        }
    except KeyError:
        return {"query": query_string}

def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "2":
        return "Male"
    if raw_gender == "1":
        return "Female"


def convert_events(date_admitted, hospitalized, icu, date_death):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_admitted),
                "end": convert_date(date_admitted),
            },
        }
    ]
    if hospitalized == "2":
        events.append(
            {
                "name": "hospitalAdmission",
                "dateRange": {
                    "start": convert_date(date_admitted),
                    "end": convert_date(date_admitted),
                },
                "value": "Yes",
            }
        )
    if icu == "1":
        events.append(
            {
                "name": "icuAdmission",
                "dateRange": {
                    "start": convert_date(date_admitted),
                    "end": convert_date(date_admitted),
                },
                "value": "Yes",
            }
        )
    if date_death != "9999-99-99":
        events.append(
            {
                "name": "outcome",
                "dateRange": {
                    "start": convert_date(date_death),
                    "end": convert_date(date_death),
                },
                "value": "Death",
            }
        )
    return events


def convert_demographics(gender: str, age: str, nationality: str, national_origin: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        if float(age) < 120:
            demo["ageRange"] = {"start": float(age), "end": float(age)}
    if nationality == "1":
        demo["nationalities"] = ["Mexican"]
    elif nationality == "2":
        demo["nationalities"] = [national_origin]
    return demo or None


def convert_notes(
    pregnant: str,
    speaks_indig: str,
    contact: str,
    migrant: str,
    immunosuppressed: str,
    smoker: str,
    identifies_indigenous: str,
    other: str,
):
    raw_notes = []
    if pregnant == "1":
        raw_notes.append("Pregnant")
    if speaks_indig == "1":
        raw_notes.append("Speaks indigenous language")
    if contact == "1":
        raw_notes.append("Had contact with other SARS CoV-2 case")
    if migrant == "1":
        raw_notes.append("Migrant")
    if immunosuppressed == "1":
        raw_notes.append("Patient with immunosupression")
    if smoker == "1":
        raw_notes.append("Smoker")
    if identifies_indigenous == "1":
        raw_notes.append("Self-identifies as indigenous")
    if other == "1":
        raw_notes.append("Unspecified pre-existing condition")
    notes = (", ").join(raw_notes)
    if notes == "":
        return None
    return notes


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            classification = parsing_lib.safe_int(row.get('CLASIFICACION_FINAL', None))
            # 1	CASO DE COVID-19 CONFIRMADO POR ASOCIACIÓN CLÍNICA EPIDEMIOLÓGICA
            # 2	CASO DE COVID-19 CONFIRMADO POR COMITÉ DE  DICTAMINACIÓN
            # 3	CASO DE SARS-COV-2  CONFIRMADO
            # 4	INVÁLIDO POR LABORATORIO
            # 5	NO REALIZADO POR LABORATORIO
            # 6	CASO SOSPECHOSO
            # 7	NEGATIVO A SARS-COV-2
            if classification not in [1, 2, 3]:
                continue
            try:
                case = {
                    "caseReference": {
                        "sourceId": source_id, 
                        "sourceUrl": source_url,
                        "sourceEntryId": row["ID_REGISTRO"]},
                    "location": convert_location(
                        row["ENTIDAD_RES"], row["MUNICIPIO_RES"]
                    ),
                    "events": convert_events(
                        row["FECHA_INGRESO"],
                        row["TIPO_PACIENTE"],
                        row["UCI"],
                        row["FECHA_DEF"],
                    ),
                    "demographics": convert_demographics(
                        row["SEXO"],
                        row["EDAD"],
                        row["NACIONALIDAD"],
                        row["PAIS_ORIGEN"],
                    ),
                }
                if row["NEUMONIA"] == "1":
                    row["symptoms"] = {"status": "Symptomatic", "values": ["Pneumonia"]}
                if any([row[k] == "1" for k in _COMORBIDITIES_DICT.keys()]):
                    case["preexistingConditions"] = {
                        "values": [
                            _COMORBIDITIES_DICT[k]
                            for k in _COMORBIDITIES_DICT.keys()
                            if row[k] == "1"
                        ]
                    }
                notes = convert_notes(
                    row["EMBARAZO"],
                    row["HABLA_LENGUA_INDIG"],
                    row["OTRO_CASO"],
                    row["MIGRANTE"],
                    row["INMUSUPR"],
                    row["TABAQUISMO"],
                    row["INDIGENA"],
                    row["OTRA_COM"],
                )
                if notes:
                    case["notes"] = notes
                yield case
            except ValueError as ve:
                raise ValueError(f"Unhandled data: {ve}")



def event_handler(event):
    return parsing_lib.run(event, parse_cases)


if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
