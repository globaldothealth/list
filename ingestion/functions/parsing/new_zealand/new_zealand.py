import json
import os
import sys
from datetime import datetime
import csv
from pathlib import Path

import common.parsing_lib as parsing_lib

_NZ = parsing_lib.geocode_country('NZ')
_NZ["country"] = "New Zealand"

_DHB = "DHB"
_REPORT_DATE = "Report Date"
_STATUS = "Case Status"
_GENDER = "Sex"
_AGE = "Age group"
_TRAVEL = "Overseas travel"

# Geocode data © OpenStreetMap contributors https://www.openstreetmap.org/copyright

# New Zealand data is organised by District Health Boards (DHBs) which are
# mostly similar to the regions (admin1 for NZ), but do not overlap in some
# cases. The mapping has been done manually via centroids or a city or town
# in the region.
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
    dhb = raw_entry[_DHB]
    return _GEOCODES[dhb] if 'Managed Isolation' not in dhb else _NZ


def convert_demographics(entry):
    '''
    If age is listed as 90+, setting age range as between 90 and 120.
    '''
    demo = {}
    if (age := entry[_AGE]) != "NA":
        if '90+' in age:
            demo["ageRange"] = {"start": 90, "end": 120}
        else:
            start, end = list(map(int, age.split(' to ')))
            demo["ageRange"] = {"start": start, "end": end}
    if (gender := entry[_GENDER]) != "Unknown":
        demo["gender"] = gender if gender in ['Male', 'Female'] else None

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    New Zealand case data has no UUIDs, and provides just 6 fields:

    Age group - we convert 90+ to ageRange of 90 - 120
    Case Status - (confirmed/suspected), we take only confirmed
    DHB (where the case lives - listed as "Managed isolation & quarantine" for border cases)
    Overseas Travel - boolean, no details on where. We assume this means travel in last 30 days.
    Report Date
    Sex

    We only count cases with a Report Date and with Status=Confirmed

    Cases arriving to NZ from 'Overseas' are geocoded generically to 'New Zealand'. Cases arising in NZ should
    have health board data (equivalent to admin1)
    """

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        cases = []
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

                if 'Managed Isolation' in entry[_DHB]:
                    notes.append(
                        'Case identified at border and placed into managed quarantine.')

                if notes:
                    case["notes"] = " ".join(notes)

                yield case



def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
