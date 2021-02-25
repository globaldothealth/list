import json
import os
import sys
from datetime import datetime

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

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "nationalities.json")) as json_file:
    nationalities = json.load(json_file)

_NATIONALITIES_MAP = nationalities["nationalities"]


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYY-mm-dd HH:MM:SS format, but the date filtering API
    expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d %H:%M:%S")
    # Some cases are reported using the Buddhist calendar which is 543 years ahead of the Gregorian
    year = date.year
    if year > 2540:
        corrected_year = year - 543
        return date.strftime(f"%m/%d/{corrected_year}Z")
    else:
        return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "Male" or raw_gender == "ชาย":
        return "Male"
    if raw_gender == "Female" or raw_gender == "หญิง":
        return "Female"
    else:
        return None


def convert_location(entry):
    query_terms = [
        # District doesn't have English translations.
        entry['District'],
        # Province sometimes has English translations or not or 'Unknown'
        (entry['ProvinceEn']
         if entry['ProvinceEn'] != 'Unknown' else '') or entry['Province'],
        'Thailand',
    ]
    return {"query": ", ".join([term for term in query_terms if term])}


def notes(entry):
    if entry['StatQuarantine'] == 1:
        return 'Case was in quarantine'
    else:
        return 'Case was not in quarantine'


def convert_nationality(entry):
    nationalities = []
    for key in _NATIONALITIES_MAP:
        if key in entry:
            nationalities.append(_NATIONALITIES_MAP[key])
    if nationalities:
        return nationalities
    else:
        return None


def demographics(entry):
    demo = {}
    age = entry['Age']
    # Some negative age entries
    if age and float(age) >= 0.0:
        demo["ageRange"] = {
            "start": float(age),
            "end": float(age),
        }
    gender = entry['GenderEn'] or entry['Gender']
    if gender:
        demo['gender'] = convert_gender(gender)
    nationalities = entry['Nation']
    if nationalities:
        demo['nationalities'] = convert_nationality(nationalities)
    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """Parses G.h-format case data from raw API data."""
    with open(raw_data_file, "r") as f:
        for entry in json.load(f)['Data']:
            yield {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["No"],
                    "sourceUrl": source_url
                },
                "location": convert_location(entry),
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry["ConfirmDate"]),
                            "end": convert_date(entry["ConfirmDate"]),
                        }
                    }
                ],
                "demographics": demographics(entry),
                "notes": notes(entry),
            }



def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
