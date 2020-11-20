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
_DATE_CONFIRMED = "dataNotificacao"
_DATE_SYMPTOMS = "dataInicioSintomas"
_SYMPTOMS = "sintomas"
_OTHER_SYMPTOMS = "outrosSintomas"
_HEALTHCARE_PROFESSIONAL = "profissionalSaude"
_COMORBIDITIES = "condicoes"
_TEST_TYPE = "tipoTeste"
_TEST_RESULT = "resultadoTeste"
_OUTCOME = "evolucaoCaso"
_ETHNICITY = "racaCor"
_SECURITY_PROFESSIONAL = "profissionalSeguranca"
_INDIGENOUS_GROUP = "etnia"
_FINAL_CLASSIFICATION = "classificacaoFinal"


# Symptoms and comorbidities written with variation in capitalization, so all forced to lowercase
_COMORBIDITIES_MAP = {
    "diabetes": "diabetes mellitus",
    "gestante": "pregnancy",
    "gestante de alto risco": "high risk pregnancy",
    "doenças respiratórias crônicas descompensadas": "respiratory system disease",
    "doenças renais crônicas em estágio avançado (graus 3, 4 e 5)": "chronic kidney disease",
    "doenças cardíacas crônicas": "heart disease",
    "obesidade": "obesity"
}


_SYMPTOMS_MAP = {
    "dor de garganta": "throat pain",
    "dispneia": "dyspnea",
    "febre": "fever",
    "tosse": "cough",
    # According to symptom ontology, breathing difficulty is exact synonym of dyspnea
    "dificuldade de respirar": "dyspnea",
    "dor de cabeça": "headache",
    "distúrbios gustativos": "taste alteration", 
    # Symptom ontology does not have a specific term for smell alterations
    "distúrbios olfativos": "disturbances of sensation of smell and taste"
}


unrecognizedComorbidities = [
    "portador  de  doenças cromossômicas ou estado de fragilidade imunológica",
    "imunossupressão",
    "portador  de  doenças cromossômicas ou estado de fragilidade imunológica, imunossupressão",
    "imunossupressão, portador  de  doenças cromossômicas ou estado de fragilidade imunológica",
    "puérpera (até 45 dias do parto)"
]


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    if raw_date:
        date = datetime.strptime(raw_date.split("T")[0], "%Y-%m-%d")
        return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    if raw_gender == "Feminino":
        return "Female"


def convert_test(test_type: str):
    if test_type:
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
    # One case dated July 2019
    if date_symptoms:
        if datetime.strptime(date_symptoms.split("T")[0], "%Y-%m-%d") > datetime.strptime("2019-11-01", "%Y-%m-%d"):
            events.append(
                {
                    "name": "onsetSymptoms",
                    "dateRange": {
                        "start": convert_date(date_symptoms),
                        "end": convert_date(date_symptoms)
                    }
                }
            )
    if outcome:
        events.append(
            convert_outcome(outcome)
        )
    return events


def convert_symptoms(raw_symptoms: str):
    values = []
    if raw_symptoms:
        # Some entries have 'assintomático' listed with other symptoms e.g. "Assintomático, Coriza, Tosse". These cases can't be considered as asymptomatic
        if raw_symptoms.lower() == "assintomático":
            return {"status": "Asymptomatic"}
        else:
            for key in _SYMPTOMS_MAP:
                if key in raw_symptoms.lower():
                    values.append(_SYMPTOMS_MAP[key])
            return {"status": "Symptomatic",
                    "values": values}


def convert_preexisting_conditions(raw_comorbidities: str):
    preexistingConditions = {}
    if raw_comorbidities:
        if raw_comorbidities.lower() not in unrecognizedComorbidities:
            preexistingConditions["hasPreexistingConditions"] = True

            comorbidities = []

            for key in _COMORBIDITIES_MAP:
                if key in raw_comorbidities.lower():
                    comorbidities.append(_COMORBIDITIES_MAP[key])
            if comorbidities:
                preexistingConditions["values"] = comorbidities
            return preexistingConditions


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


def convert_demographics(gender: str, age: str, healthcare_professional: str, security_professional: str, raw_ethnicity: str):
    if not any((gender, age, raw_ethnicity, healthcare_professional, security_professional)):
        return None
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age and float(age) <= 120.0:
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    if raw_ethnicity:
        demo["ethnicity"] = convert_ethnicity(raw_ethnicity)
    if healthcare_professional == "Sim":
        demo["occupation"] = "Healthcare worker"
    if security_professional == "Sim":
        demo["occupation"] = "Security guard"
    return demo


def convert_notes(raw_comorbidities: str, raw_symptoms: str, indigenous_group: str, other_symptoms: str):
    raw_notes = []
    if "imunossupressão" in raw_comorbidities.lower():
        raw_notes.append("Patient with immunosuppression")
    if "portador  de  doenças cromossômicas ou estado de fragilidade imunológica" in raw_comorbidities.lower():
        raw_notes.append("Primary immunodeficiency disease or chromosomal disease")
    if "puérpera (até 45 dias do parto)" in raw_comorbidities.lower():
        raw_notes.append("Patient given birth in the last 45 days")
    if "coriza" in raw_symptoms.lower():
        raw_notes.append("Patient with coryza")
    if "outros" in raw_symptoms.lower():
        raw_notes.append("Other symptoms reported")
    if other_symptoms:
        raw_notes.append("Non-standard symptoms listed but not parsed (please see raw data for further information)")
    if indigenous_group:
        raw_notes.append("Patient from the following indigenous group: " + indigenous_group)

    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            if row[_TEST_RESULT] == "Positivo" and row[_FINAL_CLASSIFICATION] != "Descartado" and row[_STATE] == "ACRE":
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": {
                            "query": ", ".join(
                                [row[_MUNICIPALITY], "Acre", "Brazil"]
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
                            row[_GENDER], row[_AGE], row[_HEALTHCARE_PROFESSIONAL], row[_SECURITY_PROFESSIONAL], row[_ETHNICITY]
                        ),
                        "preexistingConditions": convert_preexisting_conditions(
                            row[_COMORBIDITIES]
                        )
                    }
                    notes = convert_notes(
                        row[_COMORBIDITIES], row[_SYMPTOMS], row[_INDIGENOUS_GROUP], row[_OTHER_SYMPTOMS]
                    )
                    if notes:
                        case["notes"] = notes
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
