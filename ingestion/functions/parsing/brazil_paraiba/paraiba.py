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

_UUID = "ÿid"
_AGE = "idade"
_GENDER = "sexo"
_MUNICIPALITY = "municipio"
_STATE = "estado"
_DATE_CONFIRMED = "dataNotificacao"
_DATE_SYMPTOMS = "dataInicioSintomas"
_SYMPTOMS = "sintomas"
_HEALTHCARE_PROFESSIONAL = "profissionalSaude"
_COMORBIDITIES = "condicoes"
_TEST_TYPE = "tipoTeste"
_TEST_RESULT = "resultadoTeste"
_OUTCOME = "evolucaoCaso"

_COMORBIDITIES_MAP = {
    "Diabetes": "diabetes mellitus",
    "Gestante": "pregnancy",
    "Doenças respiratórias crônicas descompensadas": "respiratory system disease",
    "Doenças renais crônicas em estágio avançado (graus 3, 4 e 5)": "chronic kidney disease",
    "Doenças cardíacas crônicas": "heart disease",
    "Obesidade": "obesity",
}

_NONE_TYPES = set(["Não", "null", "undefined"])

_SYMPTOMS_MAP = {
    "Dor de Cabeça": "headache",
    "Distúrbios Gustativos": "taste alteration",
    "Distúrbios Olfativos": "smell alteration",
    "Dor de garganta": "throat pain",
    "Dispneia": "dyspnea",
    "Febre": "fever",
    "Tosse": "cough"
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    try:
        date = datetime.strptime(raw_date.split("T")[0], "%Y-%m-%d")
        return date.strftime("%m/%d/%YZ")
    except:
        return None


def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    if raw_gender == "Feminino":
        return "Female"


def convert_test(test_type: str):
    if test_type not in _NONE_TYPES:
        if test_type == "RT-PCR":
            return "PCR test"
        for i in ["TESTE", "ELISA", "CLIA"]:
            if i in test_type:
                return "Serological test"


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
    elif outcome == "Internado em UTI":
        return {
            "name": "icuAdmission",
            "value": "Yes"
        }
    elif outcome == "Internado":
        return {
            "name": "hospitalAdmission",
            "value": "Yes"
        }


def convert_events(date_confirmed, date_symptoms, test_type, outcome):
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
    if date_symptoms not in _NONE_TYPES:
        events.append(
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": convert_date(date_symptoms),
                    "end": convert_date(date_symptoms)
                },
            }
        )
    if outcome not in _NONE_TYPES:
        events.append(
            convert_outcome(outcome)
        )
    return events


def convert_symptoms(raw_symptoms: str):
    values = []
    if raw_symptoms not in _NONE_TYPES:
        if "Assintomático" in raw_symptoms:
            return {"status": "Asymptomatic"}
        else:
            for key in _SYMPTOMS_MAP:
                if key in raw_symptoms:
                    values.append(_SYMPTOMS_MAP[key])
            return {"status": "Symptomatic",
                    "values": values}


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


def convert_demographics(gender: str, age: str, occupation: str):
    if gender in _NONE_TYPES and age in _NONE_TYPES and occupation in _NONE_TYPES:
        return None
    demo = {}
    if gender not in _NONE_TYPES:
        demo["gender"] = convert_gender(gender)
    if age not in _NONE_TYPES and float(age) <= 120.0:
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    if occupation not in _NONE_TYPES:
        demo["occupation"] = "Healthcare worker"
    return demo


def convert_notes(raw_comorbidities: str, raw_symptoms: str):
    raw_notes = []
    if "Imunossupressão" in raw_comorbidities:
        raw_notes.append("Patient with immunosuppression")
    if "Portador de doenças cromossômicas ou estado de fragilidade imunológica" in raw_comorbidities:
        raw_notes.append("Primary immunodeficiency disease or chromosomal disease")
    if "Puérpera" in raw_comorbidities:
        raw_notes.append("Recently gave birth")
    if "Coriza" in raw_symptoms:
        raw_notes.append("Patient with coryza")
    if "Outros" in raw_symptoms:
        raw_notes.append("Other symptoms reported")
    notes = (', ').join(raw_notes)
    return notes


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            confirmation_date = convert_date(row[_DATE_CONFIRMED])
            if row[_TEST_RESULT] == "Positivo" and row[_OUTCOME] != "Cancelado" and row[_STATE] == "PARAÍBA" and confirmation_date is not None:
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceEntryId": row[_UUID], "sourceUrl": source_url},
                        "location": {
                            "query": ", ".join(
                                [row[_MUNICIPALITY], "Paraíba", "Brazil"]
                            )
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_DATE_SYMPTOMS],
                            row[_TEST_TYPE],
                            row[_OUTCOME]
                        ),
                        "symptoms": convert_symptoms(row[_SYMPTOMS]),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE], row[_HEALTHCARE_PROFESSIONAL]
                        ),
                        "preexistingConditions": convert_preexisting_conditions(
                            row[_COMORBIDITIES]
                        )
                    }
                    notes = convert_notes(
                        row[_COMORBIDITIES], row[_SYMPTOMS]
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
