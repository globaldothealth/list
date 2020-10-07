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
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'common/python'))
    import parsing_lib

_DATE_CONFIRMED = "dataNotificacao"
_HEALTHCARE_WORKER = "profissionalSaude"
_PREEXISTING_CONDITIONS = "comorbidades"
_METHOD_CONFIRMATION = "tipoTeste"
_CONFIRMATION = "resultadoTeste"
_GENDER = "sexo"
_NOTES_BAIRRO = "bairro"
_MUNICIPALITY = "municipio"
_AGE = "idade"
_ETHNICITY = "racaCor"
_NOTES_INDIGENOUS_GROUP = "etniaIndigena"

_COMORBIDITIES_MAP = {
    "Diabetes": "diabetes mellitus",
    "Gestante": "pregnancy",
    "Doenças respiratórias crônicas descompensadas": "respiratory system disease",
    "Doenças renais crônicas em estágio avançado (graus 3, 4 ou 5)": "chronic kidney disease",
    "Doenças cardíacas crônicas": "heart disease"
}


def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    elif raw_gender == "Feminino":
        return "Female"


def convert_age(age: str):
    return {
        "start": float(age),
        "end": float(age)
    }


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
    # I have checked these against the UK government list of ethnicities, with the exception of
    # indigenous which I have added as it is not on the list
    if raw_ethnicity == "Preta":
        return "Black"
    elif raw_ethnicity == "Parda":
        return "Mixed"
    elif raw_ethnicity == "Amarela":
        return "Asian"
    elif raw_ethnicity == "Branca":
        return "White"
    elif raw_ethnicity == "Indigena":
        return "Indigenous"


def convert_preexisting_conditions(raw_comorbidities: str):
    preexistingConditions = {}
    if raw_comorbidities:
        preexistingConditions["hasPreexistingConditions"] = True

        comorbidities = []

        for key in _COMORBIDITIES_MAP:
            if key in raw_comorbidities:
                comorbidities.append(_COMORBIDITIES_MAP[key])

        if comorbidities:
            preexistingConditions["values"] = comorbidities

        return preexistingConditions


def convert_location(raw_entry: str):
    query = ", ".join(word for word in [raw_entry, "Amapá", "Brazil"] if word)
    return {"query": query}


def convert_notes(
        raw_comorbidities: str, raw_notes_neighbourhood: str,
        raw_notes_indigenousEthnicity: str):
    raw_notes = []
    if "Imunossupressão" in raw_comorbidities:
        raw_notes.append("Patient with immunosupression")
    if "Portador de doenças cromossômicas ou estado de fragilidade imunológica" in raw_comorbidities:
        raw_notes.append(
            "primary immunodeficiency disease or chromosomal disease")
    if raw_notes_neighbourhood:
        raw_notes.append("Neighbourhood: " + raw_notes_neighbourhood)
    if raw_notes_indigenousEthnicity:
        raw_notes.append("Indigenous ethnicity: " + raw_notes_indigenousEthnicity)

    notes = (', ').join(raw_notes)
    return notes


def convert_date(raw_date: str):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date filtering API expects mm/dd/YYYYZ format.
    """
    if raw_date:
        date = datetime.strptime(raw_date, "%Y-%m-%dT%H:%M:%S.%fZ")
        return date.strftime("%m/%d/%YZ")


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
            if float(row[_AGE]) <= 110:
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
                                "start": convert_date(row[_DATE_CONFIRMED]),
                                "end": convert_date(row[_DATE_CONFIRMED]),
                            },
                            "value": convert_confirmation_method(row[_METHOD_CONFIRMATION])
                        },
                    ],
                    "preexistingConditions": convert_preexisting_conditions(row[_PREEXISTING_CONDITIONS]),
                    "notes": convert_notes(
                        row[_PREEXISTING_CONDITIONS],
                        row[_NOTES_BAIRRO],
                        row[_NOTES_INDIGENOUS_GROUP])
                }
                yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
