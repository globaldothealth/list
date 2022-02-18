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


_UUID = "ID"
_AGE = "Edad"
_GENDER = "Sexo"
_DEPARTMENT = "Departamento Residencia"
_DISTRICT = "Distrito Residencia"
_DATE_CONFIRMED = "Fecha Confirmacion"
_QUARANTINED = "En Albergue?"


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    # Some date fields are empty
    try:
        date = datetime.strptime(raw_date, "%d/%m/%Y")
        return date.strftime("%m/%d/%YZ")
    except:
        return None


def convert_gender(raw_gender: str):
    if raw_gender == "MASCULINO":
        return "Male"
    if raw_gender == "FEMENINO":
        return "Female"


def convert_events(date_confirmed):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed),
            },
        }
    ]
    return events


def convert_demographics(gender: str, age: str):
    if all(item is None for item in [gender, age]):
        return None
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age and int(age) < 120:
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    return demo


def convert_notes(quarantined):
    raw_notes = []
    if quarantined == "SI":
        raw_notes.append("Patient was/is in quarantine")

    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=",")
        for row in reader:
            age = int(row[_AGE])
            date_confirmed = convert_date(row[_DATE_CONFIRMED])
            # Cases with age 999 are in the process of being confirmed
            if age != 999 and date_confirmed is not None:
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceEntryId": row[_UUID], "sourceUrl": source_url},
                        "location": {
                            "query": ", ".join(
                                [row[_DISTRICT], row[_DEPARTMENT], "Paraguay"]
                            )
                        },
                        "events": convert_events(
                            row[_DATE_CONFIRMED]
                        ),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE]
                        ),
                    }
                    notes = convert_notes(
                        row[_QUARANTINED]
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