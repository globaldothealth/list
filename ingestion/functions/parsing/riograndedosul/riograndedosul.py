import os
import sys
from datetime import date, datetime
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

_AGE_INDEX = 5
_GENDER_INDEX = 4
_ETHNICITY = 20
_COUNTY = 1
_DATE_CONFIRMED = 7
_DATE_SYMPTOMS = 8
_DATE_HOSPITALIZED = 11
_DATE_DEATH = 18
_FEVER = 12
_COUGH = 13
_SORETHROAT = 14
_SHORTBREATH = 15
_OTHER = 16
_COMORBIDITIES = 17
_INDIGENOUS = 21
_NEIGHBORHOOD = 23


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    date = datetime.strptime(raw_date, "%d/%m/%y")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    if raw_gender == "Feminino":
        return "Female"


def convert_events(confirmed, symptoms, hospitalized, death):
    events = [
        {
            "name": "confirmed",
            "dateRange":
            {
                "start": convert_date(confirmed),
                "end": convert_date(confirmed),
            },
        }
    ]
    if symptoms:
        events.append({
            "name": "onsetSymptoms",
            "dateRange":
            {
                "start": convert_date(symptoms),
                "end": convert_date(symptoms),
            },
        })
    if hospitalized != "NAO":
        events.append({
            "name": "hospitalAdmission",
            "dateRange":
            {
                "start": convert_date(hospitalized),
                "end": convert_date(hospitalized),
            },
            "value": "Yes"
        })
    if death:
        events.append({
            "name": "outcome",
            "dateRange":
            {
                "start": convert_date(death),
                "end": convert_date(death),
            },
            "value": "Death"
        })
    return events


def convert_symptoms(fever: str, cough: str, sorethroat: str, shortbreath: str, other: str):
    symptoms = []
    if fever == "SIM":
        symptoms.append("Fever")
    if cough == "SIM":
        symptoms.append("Cough")
    if sorethroat == "SIM":
        symptoms.append("Sore Throat")
    if shortbreath == "SIM":
        symptoms.append("Shortness of Breath")
    if other == "SIM":
        symptoms.append("Other")
    return symptoms


def convert_preexisting_conditions(raw_commorbidities: str):
    preexistingConditions = {}
    if raw_commorbidities:
        preexistingConditions["hasPreexistingConditions"] = True
        commorbidities = {
            'Doenças renais crônicas em estágio avançado (graus 3, 4 ou 5)': 'chronic kidney disease',
            'Asm': 'asthma',
            'Doença Cardiovascular Crônica': 'cardiovascular disease',
            'Doenças cardíacas crônicas': 'heart disease',
            'Doença Hematológica Crônic': "hematopoietic system disease",
            'Doença Renal Crônic': 'kidney disease',
            'Doença Hepática Crônic': 'liver disease',
            'Doença Neurológica Crônic': "nervous system disease",
            'Pneumatopatia Crônica': 'pneumopathy',
            'Doenças respiratórias crônicas descompensadas': 'respiratory system disease',
            'Diabetes': 'diabetes mellitus',
            'Síndrome de Down': "Down's syndrome",
            'Obesidad': 'obesity',
            'Outro': 'other',
            'Puérpera': 'recently gave birth',
            'Gestante': 'pregnancy'
        }

        commorbidities_list = []

        for key in commorbidities:
            if key in raw_commorbidities:
                commorbidities_list.append(commorbidities[key])

        preexistingConditions["values"] = commorbidities_list
        return preexistingConditions
    return None


def convert_ethnicity(raw_ethnicity: str):
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


def convert_demographics(gender: str, age: str, ethnicity: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        if age == "80 e mais":
            demo["ageRange"] = {
                "start": 80,
                "end": 80
            }
        elif age == "<1":
            demo["ageRange"] = {
                "start": 0,
                "end": 0
            }
        else:
            age_range = age.split(' a ')
            demo["ageRange"] = {
                "start": float(age_range[0]),
                "end": float(age_range[1])
            }
        if ethnicity != "NAO INFORMADO":
            demo["ethnicity"] = convert_ethnicity(ethnicity.title())
    return demo


def convert_notes(raw_commorbidities: str, raw_notes_neighbourhood: str, raw_notes_indigenousEthnicity: str):
    raw_notes = []
    if "Portador de doenças cromossômicas ou estado de fragilidade imunológica" in raw_commorbidities:
        raw_notes.append(
            "primary immunodeficiency disease or chromosomal disease")
    if "Imunossupressão" in raw_commorbidities:
        raw_notes.append("Patient with immunosupression")
    if "Imunodeficiênci" in raw_commorbidities:
        raw_notes.append("Patient with immunodeficiency")
    if raw_notes_neighbourhood:
        raw_notes.append("Neighbourhood: " + raw_notes_neighbourhood.title())
    if raw_notes_indigenousEthnicity != "NAO ENCONTRADO":
        raw_notes.append("Indigenous ethnicity: " +
                         raw_notes_indigenousEthnicity)
    notes = (', ').join(raw_notes)
    if notes != '':
        return notes
    else:
        return None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with io.open(raw_data_file, mode='r', encoding='unicode_escape') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader)  # Skip the header.
        head = [next(reader) for x in range(10)]
        cases = []
        for row in head:
            try:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "location": ", ".join([row[_COUNTY].title(), "Rio Grande do Sul", "Brazil"]),
                    "events": convert_events(
                        row[_DATE_CONFIRMED],
                        row[_DATE_SYMPTOMS],
                        row[_DATE_HOSPITALIZED],
                        row[_DATE_DEATH]),
                    "demographics": convert_demographics(
                        row[_GENDER_INDEX], row[_AGE_INDEX], row[_ETHNICITY]),
                }
                if "SIM" in (row[_FEVER], row[_COUGH], row[_SORETHROAT], row[_SHORTBREATH], row[_OTHER]):
                    case["symptoms"] = {
                        "status": "Symptomatic",
                        "values": convert_symptoms(row[_FEVER], row[_COUGH], row[_SORETHROAT], row[_SHORTBREATH], row[_OTHER])
                    }
                if row[_COMORBIDITIES]:
                    case["preexistingConditions"] = convert_preexisting_conditions(
                        row[_COMORBIDITIES])
                notes = convert_notes(
                    row[_COMORBIDITIES], row[_NEIGHBORHOOD], row[_INDIGENOUS])
                if notes:
                    case["notes"] = notes
                cases.append(case)
            except ValueError as ve:
                print(ve)
        return cases


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
