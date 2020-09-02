import os
import sys
from datetime import date, datetime
import csv

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if ('lambda' not in sys.argv[0]):
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'common/python'))
import parsing_lib

_DATE_CONFIRMED_INDEX = 0
_HEALTHCARE_WORKER_INDEX = 1
_PREEXISTING_CONDITIONS_INDEX = 2
_METHOD_CONFIRMATION_INDEX = 3
_CONFIRMATION_INDEX = 4
_GENDER_INDEX = 5
_NOTES_BAIRRO_INDEX = 6
_MUNICIPALITY_INDEX = 7
_AGE_INDEX = 8
_ETHNICITY_INDEX = 9
_NOTES_INDIGENOUS_GROUP_INDEX = 10

def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    elif raw_gender == "Feminino":
        return "Female"
    # TODO(AB, Anya): Handle ensuring None fields aren't sent in requests.
    return "Other"

def convert_age(age: float):
    return {
        "start": age,
        "end": age
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
    return None

def convert_ethnicity(raw_ethnicity: str):
    #I have checked these against the UK government list of ethnicities, with the exception of 
    #indigenous which I have added as it is not on the list
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
    return None

def convert_preexisting_conditions(raw_commorbidities: str):
    preexistingConditions = {}
    if raw_commorbidities:
        preexistingConditions["hasPreexistingConditions"] = True
        commorbidities = {
                        "Diabetes": "diabetes mellitus", 
                        "Gestante": "pregnancy",
                        "Doenças respiratórias crônicas descompensadas": "respiratory system disease",
                        "Doenças renais crônicas em estágio avançado (graus 3, 4 ou 5)": "chronic kidney disease",
                        "Doenças cardíacas crônicas": "heart disease" 
                        }
        
        commorbidities_list = []

        for key in commorbidities:
            if key in raw_commorbidities:
                commorbidities_list.append(commorbidities[key])

        preexistingConditions["values"] = commorbidities_list
        return preexistingConditions
    return None

def convert_location(raw_entry: str):
    query = ", ".join(word for word in [raw_entry, "Amapá", "Brazil"] if word)
    return {"query": query}

def convert_notes(raw_commorbidities: str, raw_notes_neighbourhood: str, raw_notes_indigenousEthnicity: str):
    raw_notes = []
    if "Imunossupressão" in raw_commorbidities:
        raw_notes.append("Patient with immunosupression")
    if "Portador de doenças cromossômicas ou estado de fragilidade imunológica" in raw_commorbidities:
        raw_notes.append("primary immunodeficiency disease or chromosomal disease")
    if raw_notes_neighbourhood:
        raw_notes.append("Neighbourhood: " + raw_notes_neighbourhood)
    if raw_notes_indigenousEthnicity:
        raw_notes.append("Indigenous ethnicity: " + raw_notes_indigenousEthnicity)

    notes = (', ').join(raw_notes)
    return notes

def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data.
        Caveats:
        1. There are no patient ID/case ID in the raw API so we aren't able
           to dedupe.
        2. There are two files in the source for Amapa, one for confirmed cases and one for confirmed
           deaths; some of these cases may also be deaths but without patient IDs we are unable to confirm.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.reader(f)
        next(reader) # Skip the header.
        cases = []
        for row in reader:
            if float(row[_AGE_INDEX]) > 110: #We have entries as high as 351 - unclear if this is days.
                print(f'age too high: {row[_AGE_INDEX]}')
                continue
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url
                },
                "location": convert_location(row[_MUNICIPALITY_INDEX]),
                "demographics": {
                    "gender": convert_gender(row[_GENDER_INDEX]),
                    "ageRange": convert_age(float(row[_AGE_INDEX])),
                    "ethnicity": convert_ethnicity(row[_ETHNICITY_INDEX]),
                    "occupation": convert_profession(row[_HEALTHCARE_WORKER_INDEX])
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": row[_DATE_CONFIRMED_INDEX],
                            "end": row[_DATE_CONFIRMED_INDEX]
                        },
                        "value": convert_confirmation_method(row[_METHOD_CONFIRMATION_INDEX])
                    },
                ],
                "preexistingConditions": convert_preexisting_conditions(row[_PREEXISTING_CONDITIONS_INDEX]),
                "notes": convert_notes(row[_PREEXISTING_CONDITIONS_INDEX], row[_NOTES_BAIRRO_INDEX], row[_NOTES_INDIGENOUS_GROUP_INDEX])
            }
            cases.append(case)
        # TODO(AB, Anya): Handle ensuring None fields aren't sent in requests.
        return [c for c in cases if c["preexistingConditions"] is not None]

def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)