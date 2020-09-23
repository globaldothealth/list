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

_DATE_DEATH_INDEX = "Data do Óbito"
_GENDER_INDEX = "Sexo"
_AGE_INDEX = "Idade"
_METHOD_CONFIRMATION_INDEX = "Método"
_DATE_SYMPTOMS_INDEX = "Inicio Sintomas"
_MUNICIPALITY_INDEX = "Município de Residência"
_PREEXISTING_CONDITIONS_INDEX = "Doenças preexistentes"

commorbidities = {
                  "Diabetes Mellitus": "diabetes mellitus", 
                  "Cardiopatia": "heart disease",
                  "Doença de Aparelho Digestivo": "gastrointestinal system disease",
                  "Doença Hepática": "liver disease",
                  "Doença Neurológica": "nervous system disease",
                  "Doença Renal": "kidney disease",
                  "Doença Respiratória": "respiratory system disease",
                  "Neoplasia": "neoplasm",
                  "Etilismo": "alcohol use disorder",
                  "Obesidade": "obesity",
                  "Transtorno mental": "mental or behavioural disorder",
                  "Hipertensão": "hypertension"
                 }

def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYY-mm-dd format, but the date filtering API
    expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d")
    return date.strftime("%m/%d/%YZ")

def convert_gender(raw_gender: str):
    if raw_gender == "Masculino":
        return "Male"
    elif raw_gender == "Feminino":
        return "Female"
    return None

def convert_age(age: str):
    if age.isdecimal():
        #Ages are mostly reported in decimal years, but there are entries like '1 ano' ['1 year'] 
        #and '1 m' ['1 month'] which need to be dealt with separately.
        return {
            "start": float(age),
            "end": float(age)
        }
    else:
        only_age = float("".join([i for i in age if not i.isalpha()]))
        if "dia" in age:
            return {
                "start": round(only_age/365.25,3), #Average number of days a year
                "end": round(only_age/365.25,3)
            }
        elif "m" in age:
            #There is one case which is reported as 1 m; I am assuming here that this also means 'mes' (month)
            return {
                "start": round(only_age/12,3),
                "end": round(only_age/12,3)
            }
        elif "ano" in age:
            return {
                "start": only_age,
                "end": only_age
            }

def convert_confirmation_method(raw_test: str):
    if "Clínico" in raw_test or "Clinico" in raw_test: #written both ways in dataset
        return "Clinical diagnosis"
    elif "C. Epid" in raw_test:
        return "Other"
    elif "Laboratorial" in raw_test:
        return "Other"
    elif "swab" in raw_test.lower():
        #swabs are reported both as Swab and SWAB
        return "PCR test"
    elif "teste" in raw_test.lower():
        #this is reported as both Teste Rapido and teste rapido
        return "Serological test"  
    else:
        print(f'unknown confirmation method: {raw_test}')
        return "Unknown"

def convert_preexisting_conditions(raw_commorbidities: str):
    preexistingConditions = {}
    if raw_commorbidities not in ["Sem comorbidades","Doença Hematológica","Tabagismo","Imunossupressão"]:
        preexistingConditions["hasPreexistingConditions"] = True
        
        commorbidities_list = []

        for key in commorbidities:
            if key in raw_commorbidities:
                commorbidities_list.append(commorbidities[key])

        preexistingConditions["values"] = commorbidities_list
        return preexistingConditions
    else:
        return None         

def convert_location(raw_entry: str):
    query = ", ".join(word for word in [raw_entry, "Paraíba", "Brazil"] if word)
    return {"query": query}

def convert_notes(raw_commorbidities: str):
    raw_notes = []
    if "Imunossupressão" in raw_commorbidities:
        raw_notes.append("Patient with immunosupression")
    if "Tabagismo" in raw_commorbidities:
        raw_notes.append("Smoker")
    if "Doença Hematológica" in raw_commorbidities: 
        raw_notes.append("Hematologic disease")
    if "Outros" in raw_commorbidities: 
        raw_notes.append("Unspecified pre-existing condition")
    notes = (', ').join(raw_notes)
    return notes


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data.
        Caveats:
        1. There are no patient ID/case ID in the raw API so we aren't able
           to dedupe.
        2. This data only includes deaths from Covid-19 so the outcome of all cases will be death.
        3. There is no date of confirmation.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if datetime.strptime(row[_DATE_SYMPTOMS_INDEX], "%Y-%m-%d") < datetime.strptime("2019-11-01", "%Y-%m-%d"): #One date is recorded as year 2000
                print("date out of range:" + row[_DATE_SYMPTOMS_INDEX])
                continue
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url
                },
                "location": convert_location(row[_MUNICIPALITY_INDEX]),
                "demographics": {
                    "gender": convert_gender(row[_GENDER_INDEX]),
                    "ageRange": convert_age(row[_AGE_INDEX]),
                },
                "events": [
                    {
                        "name": "confirmed",
                        "value": convert_confirmation_method(row[_METHOD_CONFIRMATION_INDEX])
                    },
                    {
                        "name" : "onsetSymptoms",
                        "dateRange":
                        {
                            "start": convert_date(row[_DATE_SYMPTOMS_INDEX]),
                            "end": convert_date(row[_DATE_SYMPTOMS_INDEX])
                        },                      
                    },
                    {
                        "name" : "outcome",
                        "dateRange":
                        {
                            "start": convert_date(row[_DATE_DEATH_INDEX]),
                            "end": convert_date(row[_DATE_DEATH_INDEX])
                        }, 
                        "value" : "Death"                       
                    }
                ],
                "preexistingConditions": convert_preexisting_conditions(row[_PREEXISTING_CONDITIONS_INDEX]),
                "notes": convert_notes(row[_PREEXISTING_CONDITIONS_INDEX])
            }
            yield case
        
def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)