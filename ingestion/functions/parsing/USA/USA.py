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

_AGE = "age_group"
_GENDER = "sex"
_ETHNICITY = "race_ethnicity_combined"
_DATE_CONFIRMED = "cdc_report_dt"
_DATE_SYMPTOMS = "onset_dt"
_COMORBIDITIES = "medcond_yn"
_CONFIRMED = "current_status"
_HOSPITALIZED = "hosp_yn"
_ICU = "icu_yn"
_DEATH = "death_yn"

_NONE_TYPES = set(["Missing", "Unknown", "NA", None])


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    try:
        date = datetime.strptime(raw_date, "%Y/%m/%d")
        return date.strftime("%m/%d/%YZ")
    except:
        return None


def convert_gender(raw_gender: str):
    if raw_gender == "Male":
        return "Male"
    if raw_gender == "Female":
        return "Female"
    if raw_gender == "Other":
        return "Other"


def convert_outcome(hospitalized: str, icu: str, death: str):
    if death == "Yes":
        return {
            "name": "outcome",
            "value": "Death"
        }
    elif icu == "Yes":
        return {
            "name": "icuAdmission",
            "value": "Yes"
        }
    elif hospitalized == "Yes":
        return {
            "name": "hospitalAdmission",
            "value": "Yes"
        }


def convert_events(date_confirmed, date_symptoms, hospitalized, icu, death):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed)
            }
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
    if convert_outcome(hospitalized, icu, death) is not None:
        events.append(
            convert_outcome(hospitalized, icu, death)
        )
    return events


def convert_preexisting_conditions(raw_comorbidities: str):
    if raw_comorbidities == "Yes":
        preexistingConditions = {}
        preexistingConditions["hasPreexistingConditions"] = True
        return preexistingConditions


def convert_age(age: str):
    if age == "80+ Years":
        return {"start": 80, "end": 120}
    else:
        # Age in format '70 - 79 Years'
        age_range = age.partition(" - ")
        return {"start": float(age_range[0]), "end": float(age_range[2][:2])}


def convert_demographics(gender: str, age: str, ethnicity: str):
    if gender in _NONE_TYPES and age in _NONE_TYPES:
        return None
    demo = {}
    if gender not in _NONE_TYPES:
        demo["gender"] = convert_gender(gender)
    if age not in _NONE_TYPES:
        demo["ageRange"] = convert_age(age)
    if ethnicity not in _NONE_TYPES:
        demo["ethnicity"] = ethnicity
    return demo


def convert_symptoms(date_symptoms):
    # Date of first symptoms is only reported if the patient is symptomatic
    if date_symptoms not in _NONE_TYPES:
        return {"status": "Symptomatic"}


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            confirmation_date = convert_date(row[_DATE_CONFIRMED])
            if row[_CONFIRMED] == "Laboratory-confirmed case" and confirmation_date is not None:
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": {
                            "country": "United States",
                            "geoResolution": "Point",
                            "name": "United States",
                            "geometry": {
                                "latitude": 37.0902,
                                "longitude": 95.7129
                            }
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_DATE_SYMPTOMS],
                            row[_HOSPITALIZED],
                            row[_ICU],
                            row[_DEATH]
                        ),
                        "symptoms": convert_symptoms(row[_DATE_SYMPTOMS]),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE], row[_ETHNICITY]
                        ),
                        "preexistingConditions": convert_preexisting_conditions(
                            row[_COMORBIDITIES]
                        )
                    }
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
