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

_AGE = "faixa_etaria"
_GENDER = "sexo"
_MUNICIPALITY = "municipio"
_DATE_CONFIRMED = "data_notificacao"
_DATE_SYMPTOMS = "data_inicio_sintomas"
_RECOVERED = "recuperado"
_ETHNICITY = "raca_cor"
_DIABETES = "diabetes"
_LUNG = "doenca_respiratoria"
_IMMUNOSUPPRESSED = "imunossupressao"
_CARDIOVASCULAR = "doenca_cardiovascular"

_COMORBIDITIES_MAP = {
    "doenca_respiratoria": "lung disease",
    "doenca_cardiovascular": "cardiovascular system disease",
    "diabetes": "diabetes mellitus"
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    date = datetime.strptime(raw_date, "%Y%m%d")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "MASCULINO":
        return "Male"
    if raw_gender == "FEMININO":
        return "Female"


def convert_events(date_confirmed, date_symptoms, recovered):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed),
            },
        }
    ]
    if date_symptoms:
        events.append(
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": convert_date(date_symptoms),
                    "end": convert_date(date_symptoms),
                },
            }
        )
    if recovered == "SIM":
        events.append(
            {
                "name": "outcome",
                "value": "Recovered",
            }
        )
    return events


def convert_preexisting_conditions(lung: str, cardiovascular: str, diabetes: str):
    preexistingConditions = {}
    items = (lung, cardiovascular, diabetes)
    if all(item == "NAO" for item in items):
        return None

    preexistingConditions["hasPreexistingConditions"] = True
    comorbidities = []

    if lung == "SIM":
        comorbidities.append(_COMORBIDITIES_MAP["doenca_respiratoria"])
    if cardiovascular == "SIM":
        comorbidities.append(_COMORBIDITIES_MAP["doenca_cardiovascular"])
    if diabetes == "SIM":
        comorbidities.append(_COMORBIDITIES_MAP["diabetes"])

    if comorbidities:
        preexistingConditions["values"] = comorbidities

    return preexistingConditions


def convert_ethnicity(ethnicity: str):
    if ethnicity == "PRETA":
        return "Black"
    elif ethnicity == "PARDA":
        return "Mixed"
    elif ethnicity == "AMARELA":
        return "Asian"
    elif ethnicity == "BRANCA":
        return "White"
    elif ethnicity == "INDIGENA":
        return "Indigenous"


def convert_demographics(gender: str, age: str, ethnicity: str):
    if not any((gender, age, ethnicity)):
        return None
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        if age == ">= 80 anos":
            demo["ageRange"] = {"start": 80, "end": 120}
        # No age resolution provided below 10 years
        elif age == "< 10 anos":
            demo["ageRange"] = {"start": 0, "end": 9}
        else:
            # Age in format '20 a 29 anos'
            age_range = age.partition(" a ")
            demo["ageRange"] = {"start": float(age_range[0]), "end": float(age_range[2][:2])}
    if ethnicity:
        demo["ethnicity"] = convert_ethnicity(ethnicity)
    return demo


def convert_notes(immunosuppressed: str):
    raw_notes = []
    if immunosuppressed == "SIM":
        raw_notes.append("Patient with immunosuppression")

    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            try:
                case = {
                    "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                    "location": {
                        "query": ", ".join(
                            [row[_MUNICIPALITY], "Goiás", "Brazil"]
                        )
                    },
                    "events": convert_events(
                        row[_DATE_CONFIRMED],
                        row[_DATE_SYMPTOMS],
                        row[_RECOVERED]
                    ),
                    "demographics": convert_demographics(
                        row[_GENDER],
                        row[_AGE],
                        row[_ETHNICITY]
                    ),
                }
                case["preexistingConditions"] = convert_preexisting_conditions(
                    row[_LUNG],
                    row[_CARDIOVASCULAR],
                    row[_DIABETES]
                )
                notes = convert_notes(
                    row[_IMMUNOSUPPRESSED]
                )
                if notes:
                    case["notes"] = notes
                yield case
            except ValueError as ve:
                raise ValueError(f"error converting case: {ve}")



def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
