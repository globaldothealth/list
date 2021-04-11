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

def convert_date(raw_date: str, p1=False):
    """
    Convert raw date field into a value interpretable by the dataserver.
    If parsing P1 data, dates are in different format so set p1 to True
    """
    if p1:
        date = datetime.strptime(raw_date, "%Y-%m-%d")
    else:
        date = datetime.strptime(raw_date, "%d/%m/%Y")
    return date.strftime("%m/%d/%YZ")

def convert_location(entry):
    return {"query": entry['location.query']}

def convert_demographics(entry):
    demo = {}
    if entry['demographics.ageRange.start']:
        demo["ageRange"] = {
            "start": float(entry['demographics.ageRange.start']),
            "end": float(entry['demographics.ageRange.end'])
        }
    if entry['demographics.nationalities']:
        demo["nationalities"] = [entry['demographics.nationalities']]
    for field in ['gender', 'ethnicity', 'occupation']:
        if entry[f'demographics.{field}']:
            demo[field] = entry[f'demographics.{field}']
    return demo or None

def get_all_events(entry):
    events = []
    for field in [
        'onsetSymptoms',
        'hospitalAdmission',
        'icuAdmission',
        'firstClinicalConsultation',
        'outcome',
            'selfIsolation']:
        if entry[f'events.{field}.value']:
            event = {"name": field,
                     "value": entry[f'events.{field}.value']}

            if entry[f'events.{field}.date.start']:
                event["dateRange"] = {
                    "start": convert_date(
                        entry[f'events.{field}.date.start'])}
            if entry[f'events.{field}.date.end']:
                event["dateRange"]['end'] = convert_date(
                    entry[f'events.{field}.date.end'])
            events.append(event)
    return [e for e in events if e]


def get_preexisting_conditions(entry):
    preexistingConditions = {}
    preexistingConditions["hasPreexistingConditions"] = True
    preexistingConditions["values"] = [entry['preexistingConditions.values']]
    return preexistingConditions


def get_travel_history(entry):
    travel_history = {}
    if entry['travelHistory.traveledPrior30Days'].lower() == 'yes':
        travel_history['traveledPrior30Days'] = True
        travel = {}
        if entry['travelHistory.travel.methods']:
            travel['methods'] = [entry['travelHistory.travel.methods']]
        if entry['travelHistory.travel.purpose']:
            travel['purpose'] = entry['travelHistory.travel.purpose']
        if entry['travelHistory.travel.location.name']:
            travel['location'] = {
                'query': entry['travelHistory.travel.location.name']}
        if entry['travelHistory.travel.dateRange.start']:
            travel['dateRange'] = {
                'start': convert_date(
                    entry['travelHistory.travel.dateRange.start']), 'end': convert_date(
                    entry['travelHistory.travel.dateRange.end'])}
        if travel:
            travel_history['travel'] = [travel]
        return travel_history
    elif entry['travelHistory.traveledPrior30Days'].lower() == 'no':
        travel_history['traveledPrior30Days'] = False
        return travel_history



def get_genome_data(entry):
    genome_data = {}
    genome_data['repositoryUrl'] = 'https://www.gisaid.org/'
    genome_data['sequenceId'] = entry['genomeSequences.sequence.accession']
    if entry['genomeSequences.sample.collection.date']:
        genome_data['sampleCollectionDate'] = convert_date(
            entry['genomeSequences.sample.collection.date'])

    if entry['genomeSequences.sequence.name']:
        genome_data['sequenceName'] = entry['genomeSequences.sequence.name']
    if entry['genomeSequences.sequence.length']:
        genome_data['sequenceLength'] = int(entry['genomeSequences.sequence.length'])

    return [genome_data]

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses variant data from a number of sources, combining GISAID and manually added variants from the news
    """
    case_count = 1
    with open(raw_data_file, "r", encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=',')
        for entry in reader:
            sourceurl = entry['caseReference.sourceUrl']
            if sourceurl != "http://www.xinhuanet.com/english/2021-01/28/c_139702375.htm":
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": entry['caseReference.sourceUrl']},
                    "events": get_all_events(entry)
                }
                if entry['caseReference.additionalSources']:
                    case['additionalSources'] = [
                        entry['caseReference.additionalSources']]

                demographics = convert_demographics(entry)
                if demographics:
                    case["demographics"] = demographics

                case['location'] = convert_location(entry)
                case['events'].append(
                    {
                        "name": "confirmed", "dateRange": {
                            "start": convert_date(
                                entry["events.confirmed.date.start"]), "end": convert_date(
                                entry["events.confirmed.date.end"])}})

                if entry['preexistingConditions.hasPreexistingConditions'] == 'TRUE':
                    case['preexistingConditions'] = get_preexisting_conditions(
                        entry)
                if entry['transmission.places']:
                    case['transmission'] = {
                        'places': [entry['transmission.places']]}
                if entry['travelHistory.traveledPrior30Days']:
                    case['travelHistory'] = get_travel_history(entry)
                if entry['genomeSequences.sequence.accession']:
                    case['genomeSequences'] = get_genome_data(entry)
                if entry['notes']:
                    case['notes'] = entry['notes']

                for _ in range(int(entry['number.of.cases'])):
                    case["caseReference"]["sourceEntryId"] = f"B.1.351_{case_count}"
                    case_count += 1
                    yield case


def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
