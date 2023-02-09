import json
import os
import sys
from datetime import datetime
import csv
from pathlib import Path

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import parsing_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, os.pardir, 'common'))
    import parsing_lib

_NZ = parsing_lib.geocode_country('NZ')
_NZ["country"] = "New Zealand"

_REPORT_DATE = "Report Date"
_STATUS = "Case Status"
_GENDER = "Sex"
_AGE = "Age group"
_DISTRICT = "District"
_TRAVEL = "Overseas travel"
_INFECTION_STATUS = "Infection status"
_NUMBER_OF_CASES_IN_LINE = "Number of cases reported"

# Geocode data © OpenStreetMap contributors https://www.openstreetmap.org/copyright

# Regions are identified as 'District's in the source data
with (Path(__file__).parent / 'geocodes.json').open() as geof:
    _GEOCODES = json.load(geof)
_GEOCODES = {
    g: {
        "name": g,
        # not really admin1, but close enough
        "administrativeAreaLevel1": g,
        "country": "New Zealand",
        "geoResolution": "Admin1",
        "geometry": _GEOCODES[g]
    }
    for g in _GEOCODES
}


def convert_date(raw_date: str):
    "Convert raw date field into a value interpretable by the dataserver"
    return datetime.fromisoformat(raw_date).strftime("%m/%d/%YZ")


def convert_location(raw_entry):
    district = raw_entry[_DISTRICT]
    return _GEOCODES.get(district) or _NZ


def convert_demographics(entry):
    '''
    If age is listed as 90+, setting age range as between 90 and 120.
    '''
    demo = {}
    if (age := entry[_AGE]) not in ["NA", "Unknown"]:
        if '+' in age:
            start = int(age.rstrip('+'))
            demo["ageRange"] = {"start": start, "end": 120}
        else:
            start, end = list(map(int, age.split(' to ')))
            demo["ageRange"] = {"start": start, "end": end}
    if (gender := entry[_GENDER]) != "Unknown":
        demo["gender"] = gender if gender in ['Male', 'Female'] else None

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    New Zealand case data has no UUIDs, and provides 8 fields:

    Report Date -
    Case Status - (confirmed/probable), we take only confirmed
    Sex -
    Age group - we convert 90+ to ageRange of 90 - 120
    District -
    Overseas Travel - boolean, no details on where. We assume this means travel
        in last 30 days.
    Infection status -
    Number of cases reported - We loop over this field to yield one entry per
        case.

    We only count cases with a Report Date and with Status=Confirmed

    Cases arriving to NZ from 'Overseas' are geocoded generically to
        'New Zealand'. Cases arising in NZ should have health board data
        (equivalent to admin1)
    """

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            if entry[_STATUS] == 'Confirmed' and entry[_REPORT_DATE]:
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
                                "start": convert_date(entry[_REPORT_DATE]),
                                "end": convert_date(entry[_REPORT_DATE])
                            }
                        },
                    ]
                }
                if case["demographics"] is None:
                    del case["demographics"]
                if entry[_TRAVEL] == 'Yes':
                    case["travelHistory"] = {
                        "traveledPrior30Days": True
                    }
                    notes.append('Case imported from abroad.')

                if 'At the border' in entry[_DISTRICT]:
                    notes.append(
                        'Case identified at border.')

                if notes:
                    case["notes"] = " ".join(notes)

                for _ in range(int(entry[_NUMBER_OF_CASES_IN_LINE])):
                    yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
