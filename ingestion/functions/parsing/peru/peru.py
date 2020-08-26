import json
import os
import sys
from datetime import date, datetime
import pandas as pd


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
    department = raw_entry["DEPARTAMENTO"]
    province = raw_entry["PROVINCIA"]
    district = raw_entry["DISTRITO"]

    query_terms = ("Peru",)
    location = {"country": "Peru"}
    if department:
        location["administrativeAreaLevel1"] = department
        query_terms = (department,) + query_terms
    if province:
        location["administrativeAreaLevel2"] = province
        query_terms = (province,) + query_terms
    if district:
        location["administrativeAreaLevel3"] = district
        query_terms = (district,) + query_terms

    location["query"] = ", ".join(query_terms)
    return location


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Two primary caveats at present:
        1. We aren't converting all fields yet.
        2. We're restricting ourselves to data with an `agebracket` present.
           This data has an interesting format in which some rows represent
           aggregate data. We need to add handling logic; until we've done so,
           this filter is used to process strictly line list data.
    """
    
    cases = pd.read_csv(raw_data_file,sep=',',encoding='ISO-8859-1')
    return [
        {
            "caseReference": {
                "sourceId": source_id,
                "sourceEntryId": entry["UUID"],
                "sourceUrl": source_url
            },
            "revisionMetadata": {
                "revisionNumber": 0,
                "creationMetadata": {
                    "curator": "auto",
                    "date": date.today().strftime("%m/%d/%Y")
                }
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
        } for i,entry in cases.iterrows()]




def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
