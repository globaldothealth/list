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
            "common/python"))
    import parsing_lib


_AGE = "idade"
_GENDER = "sexo"
_MUNICIPALITY = "municipio"
_STATE = "estado"
_DATE_CONFIRMED = "data_resultado"
_DATE_SYMPTOMS = "data_inicio_sintomas"
_SYMPTOMS = "sintomas"
_COMORBIDITIES = "comorbidades"
_PREGNANCY = "gestante"
_TEST_TYPE = "tipo_teste"
_RECOVERED = "recuperados"
_HOSPITALIZED = "internacao"
_HOSPITALIZED_ICU = "internacao_uti"
_DEATH = "obito"
_DATE_DEATH = "data_obito"
_ETHNICITY = "raca"
_CLASSIFICATION = "classificacao"
_DATE_HOSPITALIZATION = "data_internacao"
_DATE_ICU_ADMISSION = "data_entrada_uti"
_NEIGHBOURHOOD = "bairro,,,,,,,,,,,,,"

_COMORBIDITIES_MAP = {
    "ASMA": "asthma",
    "DIABETES": "diabetes mellitus",
    "OBESIDADE": "obesity",
    "DOENCA CARDIOVASCULAR CRONICA": "cardiovascular system disease",
    "DOENCA NEUROLOGICA CRONICA": "nervous system disease",
    "DOENCA PNEUMATICA CRONICA": "respiratory system disease",
    "SINDROME DE DOWN": "Down syndrome",
    "DOENCA HEMATOLOGICA CRONICA": "hematological disease",
    "DOENCA HEPATICA CRONICA": "liver disease",
    "DOENCA RENAL CRONICA": "chronic kidney disease",
    "HIPERTENSAO": "hypertension",
    "CANCER": "cancer"
}


_SYMPTOMS_MAP = {
    "CANSACO": "tiredness",
    "TOSSE": "cough",
    "DOR DE GARGANTA": "throat pain",
    "DISPNEIA": "dyspnea",
    "CEFALEIA": "headache",
    "FEBRE": "fever",
    "DIARREIA": "diarrhoea",
    "DOR NO CORPO": "body ache",
    "MIALGIA": "myalgia",
    "CONGESTAO NASAL": "blocked nose"
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    The date filtering API expects mm/dd/YYYYZ format.
    """
    # Two date formats in use
    try:
        date = datetime.strptime(raw_date.split(" ")[0], "%Y-%m-%d")
        return date.strftime("%m/%d/%YZ")
    except ValueError:
        try:
            date = datetime.strptime(raw_date.split(" ")[0], "%d-%m-%Y")
            return date.strftime("%m/%d/%YZ")
        except:
            return None


def convert_gender(raw_gender: str):
    if raw_gender == "MASCULINO":
        return "Male"
    if raw_gender == "FEMININO":
        return "Female"


def convert_test(test_type: str):
    if test_type:
        if test_type == "BIOLOGIA MOLECULAR (RT-PCR)":
            return "PCR test"
        if test_type == "IMUNOLOGICO (TESTE RAPIDO)":
            return "Serological test"


def convert_events(date_confirmed, date_symptoms, test_type, recovered, death, date_death, hospitalized, hospitalized_icu, date_hospitalized, date_icu_admission):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed)
            },
            "value": convert_test(test_type)
        }
    ]
    if date_symptoms:
        events.append(
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": convert_date(date_symptoms),
                    "end": convert_date(date_symptoms)
                }
            }
        )
    if recovered == "SIM":
        events.append(
            {
                "name": "outcome",
                "value": "Recovered"
            }
        )
    if death == "SIM":
        events.append(
            {
                "name": "outcome",
                "dateRange": {
                    "start": convert_date(date_death),
                    "end": convert_date(date_death)
                },
                "value": "Death"
            }
        )
    if hospitalized == "INTERNADO":
        events.append(
            {
                "name": "hospitalAdmission",
                "dateRange": {
                    "start": convert_date(date_hospitalized),
                    "end": convert_date(date_hospitalized)
                },
                "value": "Yes"
            }
        )
    if hospitalized_icu == "INTERNADO UTI":
        events.append(
            {
                "name": "icuAdmission",
                "dateRange": {
                    "start": convert_date(date_icu_admission),
                    "end": convert_date(date_icu_admission)
                },
                "value": "Yes"
            }
        )
    return events


def convert_symptoms(raw_symptoms: str):
    values = []
    if raw_symptoms:
        for key in _SYMPTOMS_MAP:
            if key in raw_symptoms:
                values.append(_SYMPTOMS_MAP[key])
        return {"status": "Symptomatic",
                "values": values}


def convert_preexisting_conditions(raw_comorbidities: str, pregnancy):
    preexistingConditions = {}
    comorbidities = []

    for key in _COMORBIDITIES_MAP:
        if key in raw_comorbidities:
            comorbidities.append(_COMORBIDITIES_MAP[key])

    if pregnancy == "IDADE GESTATIONAL":
        comorbidities.append("pregnancy")
    
    if comorbidities:
        preexistingConditions["hasPreexistingConditions"] = True
        preexistingConditions["values"] = comorbidities
        return preexistingConditions


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


def convert_demographics(gender: str, age: str, raw_ethnicity: str):
    if not any((gender, age, raw_ethnicity)):
        return None
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age and float(age) <= 120.0:
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    if raw_ethnicity:
        demo["ethnicity"] = convert_ethnicity(raw_ethnicity)
    return demo


def convert_notes(raw_comorbidities: str, raw_symptoms: str, neighbourhood, given_birth):
    raw_notes = []
    if "IMUNODEPRESSAO" in raw_comorbidities:
        raw_notes.append("Patient with immunosuppression")
    if "CORIZA" in raw_symptoms:
        raw_notes.append("Patient with coryza")
    if "PUERPERA" in given_birth:
        raw_notes.append("Recently gave birth")
    #  The neighbourhood entry is very variable and includes entries such as "00000"
    if neighbourhood and neighbourhood != "NULL":
        raw_notes.append("Neighbourhood: " + neighbourhood)
    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.

    Note that this dataset has no UUIDs.

    The neighbourhood data contains very variable information and should be interpreted with caution.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            # A few anomalous confirmation dates reported e.g. from the year 1990
            confirmation_date = convert_date(row[_DATE_CONFIRMED])
            if row[_CLASSIFICATION] == "CONFIRMADO" and row[_STATE] == "SANTA CATARINA" and confirmation_date is not None and datetime.strptime(confirmation_date.split("Z")[0], "%m/%d/%Y") > datetime.strptime("11/01/2020", "%m/%d/%Y"):
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": {
                            "query": ", ".join(
                                [row[_MUNICIPALITY], "Santa Catarina", "Brazil"]
                            )
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_DATE_SYMPTOMS],
                            row[_TEST_TYPE],
                            row[_RECOVERED],
                            row[_DEATH],
                            row[_DATE_DEATH],
                            row[_HOSPITALIZED],
                            row[_HOSPITALIZED_ICU],
                            row[_DATE_HOSPITALIZATION],
                            row[_DATE_ICU_ADMISSION]
                        ),
                        "symptoms": convert_symptoms(row[_SYMPTOMS]),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE], row[_ETHNICITY]
                        ),
                        "preexistingConditions": convert_preexisting_conditions(
                            row[_COMORBIDITIES], row[_PREGNANCY]
                        )
                    }
                    notes = convert_notes(
                        row[_COMORBIDITIES], row[_SYMPTOMS], row[_NEIGHBOURHOOD], row[_PREGNANCY]
                    )
                    if notes:
                        case["notes"] = notes
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
