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

def convert_date(raw_date: str,p1=False):
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
    location = {}
    location["query"] = entry['location.query']
    for field in ['administrativeAreaLevel1','administrativeAreaLevel2','administrativeAreaLevel3','name','country']:
        if entry[f'location.{field}']:
            location[field] = entry[f'location.{field}']
    
    return location

def convert_demographics(entry):
    demo = {}
    if entry['demographics.ageRange.start']:
        demo["ageRange"] = {
            "start": float(entry['demographics.ageRange.start']),
            "end": float(entry['demographics.ageRange.end'])
        }
    if entry['demographics.nationalities']:
        demo["nationalities"] = [entry['demographics.nationalities']]
        
    for field in ['gender','ethnicity','occupation']:
        if entry[f'demographics.{field}']:
            demo[field] = entry[f'demographics.{field}']
    return demo or None


def get_all_events(entry):
    events = []
    for field in ['onsetSymptoms','hospitalAdmission','icuAdmission','firstClinicalConsultation','outcome','selfIsolation']:
        event = {"name": field,
                        "value": entry[f'events.{field}.value']}
        
        if entry[f'events.{field}.date.start']:                       
            event["dateRange"] = {"start": convert_date(entry[f'events.{field}.date.start'])}
        if entry[f'events.{field}.date.end']:
            event["dateRange"]['end'] = convert_date(entry[f'events.{field}.date.end'])
        events.append(event)
    return [e for e in events if e]
                            
    
def get_preexisting_conditions(entry):
    preexistingConditions = {}
    preexistingConditions["hasPreexistingConditions"] = True
    preexistingConditions["values"] = [entry['preexistingConditions.values']]
    return preexistingConditions


def get_travel_history(entry):
    travel_history = {}
    travel_history['traveledPrior30Days'] = entry['travelHistory.traveledPrior30Days']
    if entry['travelHistory.traveledPrior30Days'] in ['Yes','yes']:
        travel = {}
        if entry['travelHistory.travel.methods']:
            travel['methods'] = entry['travelHistory.travel.methods']
        if entry['travelHistory.travel.purpose']:
            travel['purpose'] = entry['travelHistory.travel.purpose']
        if entry['travelHistory.travel.location.name']:
            travel['location'] = {'name': entry['travelHistory.travel.location.name']}
        if entry['travelHistory.travel.dateRange.start']:
            travel['dateRange'] = {'start': convert_date(entry['travelHistory.travel.dateRange.start']),
                                  'end': convert_date(entry['travelHistory.travel.dateRange.end'])}
        
        travel_history['travel'] = travel
        
    return travel_history or None

def get_genome_data(entry):
    genome_data = {}
    genome_data['repositoryUrl'] = 'https://www.gisaid.org/'
    genome_data['sequenceId'] = entry['genomeSequences.sequence.accession']
    if entry['genomeSequences.sample.collection.date']:
        genome_data['sampleCollectionDate'] = convert_date(entry['genomeSequences.sample.collection.date'])
    
    if entry['genomeSequences.sequence.name']:
        genome_data['sequenceName'] = entry['genomeSequences.sequence.name']
    if entry['genomeSequences.sequence.length']:
        genome_data['sequenceLength'] = entry['genomeSequences.sequence.length']
    
    return genome_data

def parse_cases(raw_data_file,source_id):
    """
    Parses G.h-format case data from raw API data.
    Creates a dict to map type of confirming diagnostic test from Spanish abbreviation to English.
    Assuming PR = prueba rapida (rapid serological test) and PCR = PCR test
    """

    cases = []
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=',')
        for entry in reader:
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": entry['caseReference.sourceUrl'],
                    "additionalSources": [entry['caseReference.additionalSources']]},
                "events": get_all_events(entry),
                "demographics": convert_demographics(entry)
            }
            case['location'] = convert_location(entry)
            case['events'].append({"name": "confirmed",
                                   "dateRange":
                        {
                            "start": convert_date(entry["events.confirmed.date.start"]),
                            "end": convert_date(entry["events.confirmed.date.end"])
                        }
                    })
            
            if entry['preexistingConditions.hasPreexistingConditions'] == 'TRUE':
                case['preexistingConditions'] = get_preexisting_conditions(entry)
            if entry['transmission.places']:
                case['transmission'] = {'places':[entry['transmission.places']]}
            
            if entry['travelHistory.traveledPrior30Days']:
                case['travelHistory'] = get_travel_history(entry)
            
            
            if entry['genomeSequences.sequence.accession']:
                case['genomeSequences'] = get_genome_data(entry)
            if entry['notes']:
                case['notes'] = entry['notes']
            
            if entry['number.of.cases']:
                for _ in entry['number.of.cases']:
                    yield case
            else:
                yield case 

def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
