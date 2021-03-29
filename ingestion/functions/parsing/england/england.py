import os
import sys
from datetime import datetime
import csv
import json

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


with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "geocoding_dictionaries.json")) as json_file:
    uk_ltla_map = json.load(json_file)


def convert_date(raw_date: str, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.

    Set dataserver to False in order to return version appropriate for notes.
    """
    try:
        date = datetime.strptime(raw_date, "%Y-%m-%d")
    except BaseException:
        return None
    if not dataserver:
        return date.strftime("%m/%d/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_location(raw_entry):
    '''
    Uses a dict from here https://geoportal.statistics.gov.uk/datasets/local-authority-districts-december-2019-boundaries-uk-bfe-1?geometry=-33.523%2C51.101%2C28.660%2C59.782
    This maps LTLA to coordinates. We provide UTLA as Admin2 and NHSER_name as Admin1 (1 of 9 English Regions).
    LTLA is Admin3, so we have Admin3 resolution data for all cases except 5k, for which no location is provided.
    '''
    try:
        coords = uk_ltla_map.get(raw_entry['LTLA_name'], "")
        geometry = {'latitude': coords[0],
                    'longitude': coords[1]}
        location = {}
        location["country"] = "United Kingdom"
        location["geoResolution"] = "Admin3"
        location["name"] = place_name = f"{raw_entry['LTLA_name']}, {raw_entry['UTLA_name']}, United Kingdom"
        location["geometry"] = geometry
        location["administrativeAreaLevel1"] = raw_entry['NHSER_name']
        location["administrativeAreaLevel2"] = raw_entry['UTLA_name']
        location["administrativeAreaLevel3"] = raw_entry['LTLA_name']

        return location

    except BaseException:
        print(raw_entry)
        return None


def convert_demographics(entry):
    '''
    Currently just converting age and sex directly. There are 45k cases with age < 5 and 9k cases of Age=0; not filtering these out.
    Mapping ethnicity using dict.
    '''

    ethnicity_dict = {'A': 'Asian', 'W': 'White', 'B': 'Black', 'O': 'Other'}

    demo = {}
    if entry['age']:
        demo["ageRange"] = {
            "start": float(entry['age']),
            "end": float(entry['age'])}

    if entry['sex']:
        demo["gender"] = entry['sex']

    if entry['ethnicity_final.x']:
        demo["ethnicity"] = ethnicity_dict[entry['ethnicity_final.x']]

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Out of 24k deaths, 20k have COVID-19 as cause of death (covidcod==1.0), 23k within 60 days (death_type60cod), 
    20k within 28 days.
    Has index of multiple deprivation (imd_decile), which we add to notes.
    5k out of 2.3M cases don't have any location info, so we'll leave these out.
    Currently ignoring P2CH1CQ percentages as not clear how to interpret.
    """

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        cases = []
        count = 0
        for entry in reader:
            location = convert_location(entry)
            if entry["specimen_date.x"]:
                confirmation_date = convert_date(entry["specimen_date.x"])
            if location and confirmation_date:
                notes = []
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceEntryId": entry["FINALID"],
                        "sourceUrl": source_url
                    },
                    "location": location,
                    "demographics": convert_demographics(entry)
                }
        
                
                case["events"] = [
                    {
                        "name": "confirmed",
                        "value": "PCR test",
                        "dateRange":
                        {
                            "start": confirmation_date,
                            "end": confirmation_date
                        }
                    },
                ]
                if entry["asymptomatic_indicator"]:
                    if entry["asymptomatic_indicator"] == 'N':
                        case["symptoms"] = {
                            "status": "Symptomatic",
                        }
                    elif entry["asymptomatic_indicator"] == 'Y':
                        case["symptoms"] = {
                            "status": "Asymptomatic",
                        }

                if entry["dod"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "Death",
                        "dateRange": {
                            "start": convert_date(entry['dod']),
                            "end": convert_date(entry['dod']),
                        }
                    })
                    if not entry["covidcod"]:
                        notes.append(
                            "COVID-19 not reported as cause of death.")

                if entry['cat'] == 'Care/Nursing home':                
                    case['transmission'] = ['Care home']
                    
                if entry['imd_decile']:
                    notes.append(
                        f"Case was in an area with an Index of Multiple Deprivation = {entry['imd_decile']}.")
                if not entry['death_type28'] and entry['covidcod']:
                    notes.append(
                        f"Death was not within 28 days but was considered a result of COVID-19 infection.")
                elif entry['death_type28'] and entry['covidcod']:
                    notes.append(
                        f"Death was within 28 days and considered a result of COVID-19 infection.")

                if entry['sgtf']!= '':
                    sgtf = float(entry['sgtf'])
                    if sgtf == 0.0:
                        notes.append('SGTF negative')
                    elif sgtf == 1.0:
                        notes.append('SGTF positive')
            
                if entry['sgtf_under30CT']!= '':
                    sgtf_ct = float(entry['sgtf_under30CT'])
                    if sgtf_ct == 0.0:
                        notes.append('SGTF under 30 CT negative')
                    elif sgtf_ct == 1.0:
                        notes.append('SGTF under 30 CT positive')
                
                if notes:
                    case["notes"] = ", ".join(notes)

                yield case

def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
