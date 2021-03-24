import json
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
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,os.pardir, 'common'))
    import parsing_lib

def convert_date(raw_date: str, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.
    The date is listed in mddyy format,
    """
    date = datetime.strptime(raw_date, "%m/%d/%y")
    if not dataserver:
        return date.strftime("%m/%d/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "male":
        return "Male"
    if raw_gender == "female":
        return "Female"
    return None


def filter_province(province):
    if province == 'filtered at airport':
        return None
    elif province == 'capital area':
        return 'Seoul'
    else:
        return province


def convert_location(entry):
    query_terms = [
        term for term in [
            entry.get("group", ""),
            filter_province(entry.get("province", "")),
            "South Korea"] if term]

    return {"query": ", ".join(query_terms)}


def convert_demographics(entry, current_year):
    ''' Calculating age by subtracting birth year field from current_year global variable.'''
    demo = {}
    if entry['birth_year']:
        demo["ageRange"] = {
            "start": float(current_year - float(entry['birth_year']) - 1),
            "end": float(current_year - float(entry['birth_year']))
        }
    if entry['sex']:
        demo["gender"] = convert_gender(entry['sex'])
    return demo or None


def make_notes(entry):
    notes = []
    if entry['infection_order']:
        notes.append(
            f"Case infection order is {float(entry['infection_order'])}")
    if entry['infected_by']:
        notes.append(
            f"Case was infected by case ID {int(float(entry['infected_by']))}")
    if entry['contact_number']:
        notes.append(
            f"Case contact number was {float(entry['contact_number'])}")
    if entry['infection_reason']:
        notes.append(
            f"Infection reason is given as {entry['infection_reason']}")
    if entry['exposure_start'] and entry['exposure_start']:
        notes.append(
            f"Exposure was between {convert_date(entry['exposure_start'],dataserver=False)} and {convert_date(entry['exposure_end'],dataserver=False)}")

    return notes


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from: https://raw.githubusercontent.com/ThisIsIsaac/Data-Science-for-COVID-19/master/Covid19_Dataset/patients.csv.

    Contains following columns: ID, dates of confirmation/release/death/exposure, birth year, sex, province,
    and in a subset of cases the infection number, contact number, and group of outbreak (eg a particular Church)

    Province field is not always a place name, sometimes just a note, eg 'filtered at airport'

    We are only provided patient's birth_year, so we create a global variable current_year, and get age by:
    age = current_year - birth_year. This gives patients age by end of this year, so we provide a 1 year
    range for a patient's current age.

    A subset of cases contain information on which case IDs infected others, contact number and infection number.
    These are included, but seem inconsistent so should not be fully relied upon.


    """

    current_year = datetime.now().year
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=',')
        cases = []
        notes = []
        for entry in reader:
            if entry["confirmed_date"]:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceEntryId": entry["global_id"],
                        "sourceUrl": source_url
                    },
                    "location": convert_location(entry),
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange":
                                {
                                    "start": convert_date(entry["confirmed_date"]),
                                    "end": convert_date(entry["confirmed_date"])
                                }
                        }
                    ],
                    "demographics": convert_demographics(entry, current_year),
                }

                if entry['state'] == 'deceased':
                    case["events"].append({
                        "name": "outcome",
                        "value": "Death",
                        "dateRange": {
                            "start": convert_date(entry['deceased_date']),
                            "end": convert_date(entry['deceased_date']),
                        }
                    })

                elif entry['state'] == 'released':
                    case["events"].append({
                        "name": "outcome",
                        "value": "Recovered",
                        "dateRange": {
                            "start": convert_date(entry['released_date']),
                            "end": convert_date(entry['released_date']),
                        }
                    })

                if entry['country'] != 'Korea':
                    case["travelHistory"] = {
                        "traveledPrior30Days": True,
                        "travel": [
                            {
                                "location": {
                                    "query": entry['country']
                                }
                            }]
                    }
                elif entry['province'] == 'filtered at airport':
                    case["travelHistory"] = {
                        "traveledPrior30Days": True}

                # If infected_by field is populated, add as linked case ID. If place of transmission is
                # available in 'group', also include the last word of that
                # place (church/hospital)
                if entry['infected_by']:
                    case["transmission"] = {
                        "linkedCaseIDs": [int(float(entry['infected_by']))]
                    }
                    if entry["group"]:
                        case["transmission"]["places"] = [
                            entry['group'].split(' ')[-1]]

                notes = make_notes(entry)
                if notes:
                    case["notes"] = ", ".join(notes)

                yield case



def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
