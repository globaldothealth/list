import os
import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
import csv

import common.ingestion_logging as logging
import common.parsing_lib as parsing_lib
    
logger = logging.getLogger(__name__)

_AGE = "age_group"
_GENDER = "sex"
_ETHNICITY = "race_ethnicity_combined"
# There's a space in the name of this column in the upstream data.
# This is defined as the earliest non-empty value of either the CDC report date, or
# specimen collection. https://data.cdc.gov/Case-Surveillance/COVID-19-Case-Surveillance-Public-Use-Data-with-Ge/n8mc-b4w4
_DATE_CONFIRMED = "cdc_case_earliest_dt "
_DATE_SYMPTOMS = "onset_dt"
_COMORBIDITIES = "medcond_yn"
_CONFIRMED = "current_status"
_HOSPITALIZED = "hosp_yn"
_ICU = "icu_yn"
_DEATH = "death_yn"

_NONE_TYPES = set(["Missing", "Unknown", "NA", None, ""])


def convert_date(raw_date, manual_import=False):
    """
    Convert raw date field into a value interpretable by the dataserver.

    If manual_import is set to True, returns in format recognized by MongoDB.
    """
    try:
        date = datetime.strptime(raw_date, "%Y/%m/%d")
        return (
            {"$date": date.strftime("%Y-%m-%dT00:00:00Z")}
            if manual_import else date.strftime("%m/%d/%YZ")
        )
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


def convert_events(date_confirmed, date_symptoms, hospitalized, icu, death, manual_import=False):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed, manual_import),
                "end": convert_date(date_confirmed, manual_import)
            }
        }
    ]
    if date_symptoms not in _NONE_TYPES:
        events.append(
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": convert_date(date_symptoms, manual_import),
                    "end": convert_date(date_symptoms, manual_import)
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

def parse_cases(raw_data_file: str, source_id: str, source_url: str, last_date: str = None, manual_import: bool = False):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            confirmation_date = convert_date(row[_DATE_CONFIRMED], manual_import)
            if (
                manual_import and last_date and confirmation_date and
                confirmation_date["$date"] >= last_date
            ):
                logger.info(f"Skipping too recent case, on or after {last_date}")
                continue
            if row[_CONFIRMED] == "Laboratory-confirmed case" and confirmation_date is not None:
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": {
                            "country": "United States",
                            "geoResolution": "Country",
                            "name": "United States",
                            "geometry": {
                                "latitude": 37.0902,
                                "longitude": -95.7129
                            }
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_DATE_SYMPTOMS],
                            row[_HOSPITALIZED],
                            row[_ICU],
                            row[_DEATH],
                            manual_import
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

def prepare_manual_import(raw_data_file: str, source_url: str, last_date: str = None):
    """Prepares JSON file for import to MongoDB"""
    last_date = last_date or (datetime.now() - timedelta(days=2)).date().isoformat()
    if last_date:
        logger.info(f"Will load cases before {last_date}")
    from tqdm import tqdm
    source_id = f"{Path(__file__).stem.lower()}-manual-import"
    case_json = Path('cases.json')
    if case_json.exists():
        logger.error("Existing cases.json found, remove and rerun")
        return None
    with case_json.open('w') as f:
        for c in tqdm(parse_cases(raw_data_file, source_id, source_url, last_date, manual_import=True)):
            for non_null_field in ['symptoms', 'preexistingConditions']:
                if c[non_null_field] is None:
                    del c[non_null_field]
            f.write(json.dumps(c) + "\n")


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
