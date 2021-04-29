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

_DATE_CONFIRMED = "Data de Notificação"
_HEALTHCARE_WORKER = "Profissional de Saúde"
_PREEXISTING_CONDITIONS = "Comorbidades"
_METHOD_CONFIRMATION = "Tipo de Teste"
_GENDER = "Sexo"
_NOTES_BAIRRO = "Bairro"
_MUNICIPALITY = "Município"
_AGE = "Idade"
_ETHNICITY = "Raça/Cor"
_OUTCOME = "Evolução do Caso"

_COMORBIDITIES_MAP = {
    "Diabetes": "diabetes mellitus",
    "Gestante": "pregnancy",
    "Gestante de alto risco": "high risk pregnancy",
    "Doenças respiratórias crônicas descompensadas": "respiratory system disease",
    "Doenças renais crônicas em estágio avançado (graus 3, 4 ou 5)": "chronic kidney disease",
    "Doenças cardíacas crônicas": "heart disease",
    "Obesidade": "obesity"
}


def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    elif raw_gender == "Feminino":
        return "Female"


def convert_age(age: str):
    # It seems for some cases the wrong information has been entered into the wrong columns, and so we get instances of Masculino and Feminino in the age column
    try:
        return {
            "start": float(age),
            "end": float(age)
        }
    except:
        return None


def convert_confirmation_method(raw_test: str):
    if raw_test == "RT-PCR":
        return "PCR test"
    elif "TESTE" or "ensaio" in raw_test:
        return "Serological test"
    else:
        print(f'unknown confirmation method: {raw_test}')
        return "Unknown"


def convert_profession(raw_profession: str):
    if raw_profession == "Sim":
        return "Healthcare worker"


def convert_ethnicity(raw_ethnicity: str):
    if raw_ethnicity == "PRETA":
        return "Black"
    elif raw_ethnicity == "PARDA":
        return "Mixed"
    elif raw_ethnicity == "AMARELA":
        return "Asian"
    elif raw_ethnicity == "BRANCA":
        return "White"
    elif raw_ethnicity == "INDIGENA":
        return "Indigenous"


def convert_preexisting_conditions(raw_comorbidities: str):
    preexistingConditions = {}
    comorbidities = []

    for key in _COMORBIDITIES_MAP:
        if key in raw_comorbidities:
            comorbidities.append(_COMORBIDITIES_MAP[key])
    
    if comorbidities:
        preexistingConditions["hasPreexistingConditions"] = True
        preexistingConditions["values"] = comorbidities
        return preexistingConditions
    else:
        return None

def convert_location(raw_entry: str):
    query = ", ".join(word for word in [raw_entry, "Amapá", "Brazil"] if word)
    return {"query": query}


def convert_notes(
        raw_comorbidities: str, raw_notes_neighbourhood: str):
    raw_notes = []
    if "Imunossupressão" in raw_comorbidities:
        raw_notes.append("Patient with immunosupression")
    if "Portador de doenças cromossômicas ou estado de fragilidade imunológica" in raw_comorbidities:
        raw_notes.append("primary immunodeficiency disease or chromosomal disease")
    if "Puérpera (até 45 dias do parto)" in raw_comorbidities:
        raw_notes.append("Patient given birth in the last 45 days")
    if raw_notes_neighbourhood:
        raw_notes.append("Neighbourhood: " + raw_notes_neighbourhood)

    notes = (', ').join(raw_notes)
    return notes


def convert_date(raw_date: str):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date filtering API expects mm/dd/YYYYZ format.
    """
    if raw_date.startswith("None"):
        return None
    try:
        date = datetime.strptime(raw_date, "%Y-%m-%d %H:%M:%S")
        return date.strftime("%m/%d/%YZ")
    except ValueError:
        try:
            date = datetime.strptime(raw_date, "%Y-%m-%dT%H:%M:%S.%fZ")
            return date.strftime("%m/%d/%YZ")
        except:
            return None


def convert_outcome(outcome: str):
    if outcome == "Óbito":
        return {
            "name": "outcome",
            "value": "Death"
        }
    elif outcome == "Cura":
        return {
            "name": "outcome",
            "value": "Recovered"
        }
    elif outcome == "Internado":
        return {
            "name": "hospitalAdmission",
            "value": "Yes"
        }


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data.
        Caveats:
        1. There are no patient ID/case ID in the raw API so we aren't able
           to dedupe.
        2. There are two files in the source for Amapa, one for confirmed cases and one for confirmed
           deaths; some of these cases may also be deaths but without patient IDs we are unable to confirm.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # We have entries as high as 351 - unclear if this is days.
            confirmation_date = convert_date(row[_DATE_CONFIRMED])
            age = convert_age(row[_AGE])
            if age is not None and float(row[_AGE]) <= 110 and confirmation_date is not None:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "location": convert_location(row[_MUNICIPALITY]),
                    "demographics": {
                        "gender": convert_gender(row[_GENDER]),
                        "ageRange": convert_age(row[_AGE]),
                        "ethnicity": convert_ethnicity(row[_ETHNICITY]),
                        "occupation": convert_profession(row[_HEALTHCARE_WORKER])
                    },
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange":
                            {
                                "start": confirmation_date,
                                "end": confirmation_date,
                            },
                            "value": convert_confirmation_method(row[_METHOD_CONFIRMATION])
                        },
                        convert_outcome(row[_OUTCOME])
                    ],
                    "preexistingConditions": convert_preexisting_conditions(row[_PREEXISTING_CONDITIONS]),
                    "notes": convert_notes(
                        row[_PREEXISTING_CONDITIONS],
                        row[_NOTES_BAIRRO])
                }
                yield case



def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
