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

def convert_date(date_str: str,dataserver=True):
    """ 
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in dd/mm/YYYY  format
    """    
    date = datetime.strptime(date_str.split(' ')[0], "%Y/%m/%d")
    if not dataserver:
        return date.strftime("%m/%d/%Y")
    return date.strftime("%m/%d/%YZ")



def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"
    

    
def convert_location(raw_entry):
    '''
    Using residential municipality as only available location information.
    '''
    query_terms = [
        term for term in [
            raw_entry.get("municipio_res", ""),
            "Rio de Janeiro, Brazil"]
        if type(term) == str]
    
    return {"query":  ", ".join(query_terms)}
    

def convert_age(entry: float):
    '''
    Want to return a float specifying age in years. If age field is empty, return None.
    There are some odd ages in this dataset (43 people over the age of 150). These erroneous ages
    don't have a value for the FAIXA_ETARIA field, so will only return age if this field is populated
    '''
    if entry['idade']:
        return float(entry['idade'])

    
            
def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    
    Only include cases which include a 'dt_evento' as confirmed date field. This loses ~400 cases out of 350k.
    
    Using residential municipality ('municipio_res') as case location, as its the only location field other than 
    'bairro' (neighborhood), which is missing in ~2/5 cases and cannot be easily geocoded with mapbox.
    
    
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f,delimiter=';')
        cases = []
        for entry in reader:
            if entry['classificacao'] and entry['dt_evento']:
                notes = []
                case = {
                        "caseReference": {
                            "sourceId": source_id,
                            "sourceUrl": source_url
                        },
                        "events": [
                        {
                            "name": "confirmed",
                            "dateRange":
                            {
                                "start": convert_date(entry["dt_evento"]),
                                "end": convert_date(entry["dt_evento"])
                            }
                        }
                    ],
                        "location": convert_location(entry),
                        "demographics": {
                            "ageRange": {
                                "start": convert_age(entry),
                                "end": convert_age(entry)
                            },
                            "gender": convert_gender(entry["sexo"])
                            }
                    }
                
            if entry['dt_sintoma']:
                case["symptoms"] = {
                    "status": "Symptomatic",
                }
                case["events"].append({
                    "name": "onsetSymptoms",
                    "dateRange": {
                        "start": convert_date(entry['dt_sintoma']),
                        "end": convert_date(entry['dt_sintoma']),
                    }
                })
                
            if entry['evolucao'] == 'OBITO':
                case["events"].append({
                "name": "outcome",
                "value": "Death",
                "dateRange": {
                    "start": convert_date(entry['dt_obito']),
                    "end": convert_date(entry['dt_obito']),
                    }})
            else:
                case["symptoms"] = {
                    "status": "Asymptomatic",
                }

            if entry["sexo"]=='I':
                notes.append(f'Gender not specified in case notes.')

            if entry["bairro"]:
                notes.append(f'Neighborhood of case is listed as {entry["bairro"]}')

            if entry['dias']:
                notes.append(f'Number of epidemiological days = {entry["dias"]}')
            
            if entry['dt_coleta_dt_notif']:
                notes.append(f'Date case was reported was {convert_date(entry["dt_coleta_dt_notif"],dataserver=False)}')


            case["notes"] = "\n".join(notes)
            cases.append(case)

            yield case


def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
