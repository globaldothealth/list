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

_AGE = "FaixaEtaria"
_GENDER = "Sexo"
_MUNICIPALITY = "Municipio"
_DATE_CONFIRMED = "DataNotificacao"
_DATE_DEATH = "DataObito"
_CLASSIFICATION = "Classificacao"
_OUTCOME = "Evolucao"
_LUNG = "ComorbidadePulmao"
_KIDNEY = "ComorbidadeRenal"
_DIABETES = "ComorbidadeDiabetes"
_OBESITY = "ComorbidadeObesidade"
_CARDIOVASCULAR = "ComorbidadeCardio"
_SMOKER = "ComorbidadeTabagismo"
_PCR = "DataColeta_RT_PCR"
_SEROLOGICAL_METHOD1 = "DataColetaTesteRapido"
_SEROLOGICAL_METHOD2 = "DataColetaSorologia"
_SEROLOGICAL_METHOD3 = "DataColetaSorologiaIGG"
_TEST_CLASS = "CriterioConfirmacao"
_ETHNICITY = "RacaCor"
_NEIGHBOURHOOD = "Bairro"
_FEVER = "Febre"
_DIFFICULTY_BREATHING = "DificuldadeRespiratoria"
_COUGH = "Tosse"
_SORE_THROAT = "DorGarganta"
_DIARRHOEA = "Diarreia"
_HEADACHE = "Cefaleia"
_CORYZA = "Coriza"
_HOSPITALIZED = "FicouInternado"
_INTERNAL_TRAVEL = "ViagemBrasil"
_INTERNATIONAL_TRAVEL = "ViagemInternacional"
_HEALTHCARE_PROFESSIONAL = "ProfissionalSaude"
_HOMELESS = "MoradorDeRua"
_DISABILITY = "PossuiDeficiencia"
_SCHOOLING = "Escolaridade"


_COMORBIDITIES_MAP = {
    "ComorbidadePulmao": "lung disease",
    "ComorbidadeRenal": "kidney disease",
    "ComorbidadeDiabetes": "diabetes mellitus",
    "ComorbidadeObesidade": "obesity",
    "ComorbidadeCardio": "cardiovascular system disease"
}


_EDUCATION_MAP = {
    "1ª a 4ª série incompleta do EF (antigo primário ou 1º grau)": "First four years of elementary school not completed",
    "Ensino fundamental completo (antigo ginásio ou 1º grau) ": "Elementary school completed",
    "Ensino médio completo (antigo colegial ou 2º grau ) ": "High school completed",
    "5ª à 8ª série incompleta do EF (antigo ginásio ou 1º grau)": "Years 5 to 8 of elementary school not completed",
    "Ensino médio incompleto (antigo colegial ou 2º grau )": "High school not completed",
    "Educação superior incompleta ": "Higher education not completed",
    "Educação superior completa": "Higher education completed",
    "Analfabeto": "Analphabet",
    "4ª série completa do EF (antigo primário ou 1º grau)": "Fourth year of elementary school completed"
}


_NONE_TYPES = set(["Não", "Ignorado", "-", "Não Informado", "Não se aplica", None])


_SYMPTOMS_MAP = {
    "Cefaleia": "headache",
    "DorGarganta": "throat pain",
    "Febre": "fever",
    "Tosse": "cough",
    "Diarreia": "diarrhoea",
    "DificuldadeRespiratoria": "dyspnea"
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    if raw_date:
        date = datetime.strptime(raw_date, "%Y-%m-%d")
        return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"


def convert_events(date_confirmed, pcr, serological_method1, serological_method2, serological_method3, test_class, outcome, date_death, hospitalized):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed)
            },
            "value": convert_test(pcr, serological_method1, serological_method2, serological_method3, test_class)
        }
    ]
    if hospitalized == "Sim":
        events.append(
            {
                "name": "hospitalAdmission",
                "value": "Yes"
            }
        )
    if "Óbito" in outcome:
        events.append(
            {
                "name": "outcome",
                "dateRange": {
                    "start": convert_date(date_death),
                    "end": convert_date(date_death)
                },
                "value": "Death",
            }
        )
    if "Cura" in outcome:
        events.append(
            {
                "name": "outcome",
                "value": "Recovered",
            }
        )
    return events


def convert_test(pcr: str, serological_method1: str, serological_method2: str, serological_method3: str, test_class: str):
    items = (serological_method1, serological_method2, serological_method3)
    if pcr:
        return "PCR test"
    elif any(item not in _NONE_TYPES for item in items):
        return "Serological test"
    elif "Clinico" in test_class:
        return "Clinical diagnosis"


def convert_preexisting_conditions(lung: str, kidney: str, diabetes: str,
                                   cardiovascular: str, obesity: str):
    preexistingConditions = {}
    comorbidities = []

    if lung == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["ComorbidadePulmao"])
    if kidney == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["ComorbidadeRenal"])
    if diabetes == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["ComorbidadeDiabetes"])
    if cardiovascular == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["ComorbidadeCardio"])
    if obesity == "Sim":
        comorbidities.append(_COMORBIDITIES_MAP["ComorbidadeObesidade"])

    if comorbidities:
        preexistingConditions["hasPreexistingConditions"] = True
        preexistingConditions["values"] = comorbidities
        return preexistingConditions
    else:
        return None


def convert_symptoms(headache: str, throat: str, fever: str, cough: str, diarrhoea: str, dyspnea: str):
    symptoms = {}
    items = (headache, throat, fever, cough, diarrhoea, dyspnea)
    if all(item in _NONE_TYPES for item in items):
        return None

    symptoms["status"] = "Symptomatic"
    values = []

    if headache == "Sim":
        values.append(_SYMPTOMS_MAP["Cefaleia"])
    if throat == "Sim":
        values.append(_SYMPTOMS_MAP["DorGarganta"])
    if fever == "Sim":
        values.append(_SYMPTOMS_MAP["Febre"])
    if cough == "Sim":
        values.append(_SYMPTOMS_MAP["Tosse"])
    if diarrhoea == "Sim":
        values.append(_SYMPTOMS_MAP["Diarreia"])
    if dyspnea == "Sim":
        values.append(_SYMPTOMS_MAP["DificuldadeRespiratoria"])

    if values:
        symptoms["values"] = values

    return symptoms


def convert_ethnicity(ethnicity: str):
    if ethnicity == "Preta":
        return "Black"
    elif ethnicity == "Parda":
        return "Mixed"
    elif ethnicity == "Amarela":
        return "Asian"
    elif ethnicity == "Branca":
        return "White"
    elif ethnicity == "Indigena":
        return "Indigenous"


def convert_demographics(gender: str, age: str, ethnicity: str, healthcare_professional: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age not in _NONE_TYPES:
        if age == "90 anos ou mais":
            demo["ageRange"] = {"start": 90, "end": 120}
        else:
            # Age in format '20 a 29 anos', except for '05 a 9 anos' which has a leading 0
            age_range = age.partition(" a ")
            demo["ageRange"] = {"start": float(age_range[0]), "end": float(age_range[2][:2])}
    if ethnicity:
        demo["ethnicity"] = convert_ethnicity(ethnicity)
    if healthcare_professional == "Sim":
        demo["occupation"] = "Healthcare worker"
    return demo


def convert_notes(coryza: str, smoker: str, homeless: str, neighbourhood: str, disability: str, national_travel: str, international_travel: str, education: str):
    raw_notes = []
    if coryza == "Sim":
        raw_notes.append("Patient with coryza")
    if smoker == "Sim":
        raw_notes.append("Smoker")
    if homeless == "Sim":
        raw_notes.append("Patient is homeless")
    if neighbourhood not in _NONE_TYPES:
        raw_notes.append("Neighbourhood: " + neighbourhood)
    if disability == "Sim":
        raw_notes.append("Patient with disability")
    if national_travel == "Sim":
        raw_notes.append("National travel indicated")
    if international_travel == "Sim":
        raw_notes.append("International travel indicated")
    for key in _EDUCATION_MAP:
        if key in education:
            raw_notes.append(_EDUCATION_MAP[key])
    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            if row[_CLASSIFICATION] == "Confirmados":
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": {
                            "query": ", ".join(
                                [row[_MUNICIPALITY], "Espirito Santo", "Brazil"]
                            )
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_PCR],
                            row[_SEROLOGICAL_METHOD1],
                            row[_SEROLOGICAL_METHOD2],
                            row[_SEROLOGICAL_METHOD3],
                            row[_TEST_CLASS],
                            row[_OUTCOME],
                            row[_DATE_DEATH],
                            row[_HOSPITALIZED]
                        ),
                        "symptoms": convert_symptoms(
                            row[_HEADACHE],
                            row[_SORE_THROAT],
                            row[_FEVER],
                            row[_COUGH],
                            row[_DIARRHOEA],
                            row[_DIFFICULTY_BREATHING]
                        ),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE], row[_ETHNICITY], row[_HEALTHCARE_PROFESSIONAL]
                        ),
                    }
                    case["preexistingConditions"] = convert_preexisting_conditions(
                        row[_LUNG], row[_KIDNEY], row[_DIABETES], row[_CARDIOVASCULAR], row[_OBESITY]
                    )
                    notes = convert_notes(
                        row[_CORYZA],
                        row[_SMOKER],
                        row[_HOMELESS],
                        row[_NEIGHBOURHOOD],
                        row[_DISABILITY],
                        row[_INTERNAL_TRAVEL],
                        row[_INTERNATIONAL_TRAVEL],
                        row[_SCHOOLING]
                    )
                    if notes:
                        case["notes"] = notes
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")


def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)