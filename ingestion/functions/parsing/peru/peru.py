import json
import os
import sys
from datetime import date, datetime
import csv

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
if ('lambda' not in sys.argv[0]):
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'common/python'))
import parsing_lib


def convert_date(raw_date):
    """ 
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYYmmdd format, but the data server API will
    assume that ambiguous cases (e.g. "05/06/2020") are in mm/dd/YYYY format.
    
    Adding line to ensure date has type str
    """
    raw_date = str(raw_date)
    date = datetime.strptime(raw_date, "%Y%m%d")
    return date.strftime("%m/%d/%Y")


def convert_gender(raw_gender):
    if raw_gender == "MASCULINO":
        return "Male"
    if raw_gender == "FEMENINO":
        return "Female"
    return None



def convert_location(raw_entry):
    # print(raw_entry['DISTRITO'])
    query_terms = [
        term for term in [
            raw_entry.get("DISTRITO", ""),
            raw_entry.get("PROVINCIA", ""),
            raw_entry.get("DEPARTAMENTO", ""),
            "Peru"]
        if "EN INVESTIGACIÓN" not in term]
    
    return {"query":  ", ".join(query_terms)}

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        cases = []
        for entry in reader:
            cases.append(
        {
            "caseReference": {
                "sourceId": source_id,
                "sourceEntryId": entry["UUID"],
                "sourceUrl": source_url
            },
            "location": convert_location(entry),
            "events": [
                {
                    "name": "confirmed",
                    "dateRange":
                    {
                        "start": convert_date(entry["FECHA_RESULTADO"]),
                        "end": convert_date(entry["FECHA_RESULTADO"])
                    }
                }
            ],
            "demographics": {
                "ageRange": {
                    "start": float(entry["EDAD"]),
                    "end": float(entry["EDAD"])
                },
                "gender": convert_gender(entry["SEXO"])
            }
        }) 
    return cases





def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
