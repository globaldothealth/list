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


def convert_date(raw_date: str, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.

    Set dataserver to False in order to return version appropriate for notes.
    """
    date = datetime.strptime(raw_date.split(' ')[0], "%d/%m/%Y")
    if not dataserver:
        return date.strftime("%m/%d/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "Male":
        return "Male"
    if raw_gender == "Female":
        return "Female"
    return None


def convert_location(raw_entry):
    if 'Managed Isolation' in raw_entry['DHB_label']:
        return {"query": "New Zealand"}
    else:
        return {"query": f"{raw_entry['DHB_label']}, New Zealand"}


def convert_demographics(entry):
    '''
    If age is listed as 90+, setting age range as between 90 and 120.
    '''
    demo = {}
    if entry['age_bands_fixed']:
        if '90+' in entry['age_bands_fixed']:
            demo["ageRange"] = {
                "start": 90,
                "end": 120
            }
        else:
            demo["ageRange"] = {
                "start": float(entry['age_bands_fixed'].split(' to ')[0]),
                "end": float(entry['age_bands_fixed'].split(' to ')[1])
            }
    if entry['Gender']:
        demo["gender"] = convert_gender(entry['Gender'])

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    New Zealand case data has no UUIDs, and provides just 6 fields:

    age_bands_fixed - we convert 90+ to ageRange of 90 - 120
    Status - (confirmed/suspected), we take only confirmed
    DHB (where the case lives - listed as "Managed isolation & quarantine" for border cases)
    Overseas Travel - boolean, no details on where. We assume this means travel in last 30 days.
    ReportDate
    Gender

    We only count cases with a ReportDate and with Status=Confirmed

    Cases arriving to NZ from 'Overseas' are geocoded generically to 'New Zealand'. Cases arising in NZ should
    have county data.


    """

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        cases = []
        for entry in reader:
            if entry['CaseStatus'] == 'Confirmed' and entry['ReportDate']:
                notes = []
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "location": convert_location(entry),
                    "demographics": convert_demographics(entry),
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange":
                            {
                                "start": convert_date(entry["ReportDate"]),
                                "end": convert_date(entry["ReportDate"])
                            }
                        },
                    ]
                }
                if entry['Overseas'] == 'Yes':
                    case["travelHistory"] = {
                        "traveledPrior30Days": True
                    }
                    notes.append('Case imported from abroad.')

                if 'Managed Isolation' in entry['DHB_label']:
                    notes.append(
                        'Case identified at border and placed into managed quarantine.')

                if notes:
                    case["notes"] = ", ".join(notes)

                yield case



def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
