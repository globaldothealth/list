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
            'common/python'))
    import parsing_lib

import json
import os
import sys
from datetime import date, datetime
import csv


def convert_date(raw_date: str, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.

    Removing timestamp as always midnight.

    Set dataserver to False in order to return version appropriate for notes.
    """
    date = datetime.strptime(raw_date.split(' ')[0], "%Y-%m-%d")
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
    if 'Managed Isolation' in raw_entry['DHB']:
        return None
    else:
        return {"query": f"{raw_entry['DHB']}, New Zealand"}


def convert_demographics(entry):
    '''
    If age is listed as 90+, setting age range as between 90 and 120.
    '''
    demo = {}
    if entry['Age group']:
        if '90+' in entry['Age group']:
            demo["ageRange"] = {
                "start": 90,
                "end": 120
            }
        else:

            demo["ageRange"] = {
                "start": float(entry['Age group'].split(' to ')[0]),
                "end": float(entry['Age group'].split(' to ')[1])
            }
    if entry['Sex']:
        demo["gender"] = convert_gender(entry['Sex'])

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    New Zealand case data has no UUIDs, and provides just 6 fields:

    Age range - we convert 90+ to ageRange of 90 - 120
    Status - (confirmed/suspected), we take only confirmed
    DHB (where the case lives - listed as "Managed isolation & quarantine" for border cases)
    Overseas Travel - boolean, no details on where. We assume this means travel in last 30 days.
    Report Date
    Sex


    """

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            if entry['Case Status'] == 'Confirmed':
                notes = []
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "location": convert_location(entry),
                    "demographics": convert_demographics(entry)
                }

                if entry["Report Date"]:
                    case["events"] = [
                        {
                            "name": "confirmed",
                            "dateRange":
                            {
                                "start": convert_date(entry["Report Date"]),
                                "end": convert_date(entry["Report Date"])
                            }
                        },
                    ]
                if entry['Overseas travel'] == 'Yes':
                    case["travelHistory"] = {
                        "traveledPrior30Days": True
                    }
                    notes.append('Case imported from abroad.')

                if 'Managed Isolation & quarantine' in entry['DHB']:
                    notes.append(
                        'Case identified at border and placed into managed quarantine.')

                if notes:
                    case["notes"] = ", ".join(notes)

                yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
