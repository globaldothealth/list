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


def convert_date(raw_date: str):
    """
    Convert raw date field into a value interpretable by the dataserver.
    The date is listed in YYYYmmdd format, but the data server API will
    assume that ambiguous cases (e.g. "05/06/2020") are in mm/dd/YYYY format.
    """
    date = datetime.strptime(raw_date, "%Y%m%d")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "MASCULINO":
        return "Male"
    if raw_gender == "FEMENINO":
        return "Female"
    return None


def convert_location(raw_entry):
    query_terms = [
        term for term in [
            raw_entry.get("DEPARTAMENTO", ""),
            raw_entry.get("PROVINCIA", ""),
            raw_entry.get("DISTRITO", ""),
            "Peru"]
        if term != "EN INVESTIGACIÓN"]

    return {"query": ", ".join(query_terms)}


def convert_demographics(age: str, sex: str):
    demo = {}
    if age:
        demo["ageRange"] = {
            "start": float(age),
            "end": float(age)
        }
    if sex:
        demo["gender"] = convert_gender(sex)
    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    Creates a dict to map type of confirming diagnostic test from Spanish abbreviation to English.
    Assuming PR = prueba rapida (rapid serological test) and PCR = PCR test
    """

    conf_methods = {
        'PR': 'Serological test',
        'PCR': 'PCR test'
    }

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["UUID"],
                    "sourceUrl": source_url
                },
                "location": convert_location(entry),
                "events": [
                    {
                        "name": "confirmed",
                        "value": conf_methods.get(entry['METODODX']),
                        "dateRange":
                            {
                                "start": convert_date(entry["FECHA_RESULTADO"]),
                                "end": convert_date(entry["FECHA_RESULTADO"])
                        }
                    }
                ],
                "demographics": convert_demographics(entry["EDAD"], entry["SEXO"]),
            }
            yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
