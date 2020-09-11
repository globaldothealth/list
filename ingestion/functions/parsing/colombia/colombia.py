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
    date = datetime.strptime(raw_date.split('T')[0], "%Y-%m-%d")
    return date.strftime("%m/%d/%Y")


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"
    return None


# def convert_location(raw_entry):
#     department = raw_entry["Departamento o Distrito "]
#     city = raw_entry["Ciudad de ubicación"]
# #     district = raw_entry["DISTRITO"]

#     query_terms = ("Colombia",)
#     location = {"country": "Colombia"}
#     if department:
#         location["administrativeAreaLevel1"] = department
#         query_terms = (department,) + query_terms
#     if city:
#         location["administrativeAreaLevel2"] = city
#         query_terms = (city,) + query_terms


#     location["query"] = ", ".join(query_terms)
#     return location

def convert_location(raw_entry):
    #     print(raw_entry['DISTRITO'])
    query_terms = [
        term for term in [
            raw_entry.get("Ciudad de ubicación", ""),
            raw_entry.get("Departamento o Distrito ", ""),
            "Colombia"]
        if term != '']

    return {"query": ", ".join(query_terms)}


def make_notes(raw_entry):

    return notes


def get_ethnicity(raw_entry):

    ethnicity_map = {'Otro': 'Other',
                     'Negro': 'Black',
                     'Indigeno': 'Indigenous'}

    if ethnicity_map.get(raw_entry['Pertenencia etnica'], None):
        if raw_entry['Pertenencia etnica'] == 'Indígena':
            if raw_entry['Nombre grupo etnico'] != '' and raw_entry['Nombre grupo etnico'] != 'Sin Comunidad' and raw_entry['Nombre grupo etnico'] != 'Sin definir':
                ethnicity = f"Indigenous, {raw_entry['Nombre grupo etnico']}"
            else:
                ethnicity = "Indigenous"
        else:
            ethnicity = ethnicity_map.get(
                raw_entry['Pertenencia etnica'], None)

    else:
        ethnicity = "Unknown"

    return ethnicity


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Caveats:
    - Assuming the date confirmed is the date of diagnosis (Fecha diagnostico) rather than
    Fecha de notificación (generally several days earlier). When date of diagnosis, using date reported online as proxy.

    - Tipo recuperación refers to how they decided the patient had recovered: either by 21 days elapsing since
    symptoms, or a negative PCR/antigen test

    - No dates for travel history, only distinction is between cases of type: 'Importado' vs. 'Relacionado'
    """

    symptom_map = {'Leve': 'Mild',
                   'Moderado': 'Moderate',
                   'Grave': 'Serious'}

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["ID de caso"],
                    "sourceUrl": source_url
                },
                "location": convert_location(entry),
                "notes": '',
                "demographics": {
                    "ageRange": {
                        "start": float(entry["Edad"]),
                        "end": float(entry["Edad"])
                    },
                    "gender": convert_gender(entry["Sexo"]),
                    "ethnicity": get_ethnicity(entry)
                }

            }

            if entry["Fecha diagnostico"] != '':
                case["events"] = [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry["Fecha diagnostico"]),
                            "end": convert_date(entry["Fecha diagnostico"])
                        }
                    },
                ]
            elif entry["Fecha diagnostico"] == '':
                case["events"] = [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry["fecha reporte web"]),
                            "end": convert_date(entry["fecha reporte web"])
                        }
                    },
                ]
                case["notes"] += "No Date of Diagnosis provided, so using Date Reported Online (fecha reporte web) as a proxy. This is normally approx. 1 week later. \n "

            # If patient was symptomatic, mark date of onsetSymptoms, otherwise
            # asymptomatic
            if entry["Estado"] == "Asintomático":
                case["symptoms"] = {
                    "status": "Asymptomatic",
                }
            elif entry["FIS"]:  # maybe change to elif clause and check if can parse field as date
                case["symptoms"] = {
                    "status": "Symptomatic",
                }
                case["events"].append({
                    "name": "onsetSymptoms",
                    "dateRange": {
                        "start": convert_date(entry['FIS']),
                        "end": convert_date(entry['FIS']),
                    }
                })

            # Include severity of symptoms
            if entry["Estado"] in ['Leve', 'Moderado', 'Grave']:
                case["symptoms"]["values"] = [symptom_map.get(entry['Estado'])]

            # Patient Outcome
            # If patient died, mark date
            if entry["Fecha de muerte"] != '':
                case["events"].append({
                    "name": "outcome",
                    "value": "Death",
                    "dateRange": {
                        "start": convert_date(entry['Fecha de muerte']),
                        "end": convert_date(entry['Fecha de muerte']),
                    }
                })
                if entry["Estado"] != "Fallecido":
                    case["notes"] += "Did not die from Covid-19 \n"

            if entry["atención"] == "Recuperado":
                case["events"].append({
                    "name": "outcome",
                    "value": "Recovered",
                    "dateRange": {
                        "start": convert_date(entry['Fecha recuperado']),
                        "end": convert_date(entry['Fecha recuperado']),
                    }
                })
            elif entry["atención"] == "Hospital":
                case["events"].append({
                    "name": "hospitalAdmission",
                    "value": "Yes"
                })
            elif entry["atención"] == 'Hospital UCI':
                case["events"].append({
                    "name": "icuAdmission",
                    "value": "Yes"
                })

            # Travel History - we currently do not have any travel dates, so
            # unknown whether in last 30 days (awaiting response)
            if entry["Tipo"].lower() == "importado":
                case[
                    "notes"] += f"Case is reported as importing the disease into Colombia, and country of origin is {entry['País de procedencia']} \n "
            elif entry['Tipo'].lower() == 'relacionado':
                case["notes"] += "Case was transmitted within Colombia \n "
            elif entry['Tipo'].lower() == 'en estudio':
                case["notes"] += "Case transmission under investigation (unknown) \n "

            # Add notes for each case, including date reported online and how
            # recovery was confirmed
            case["notes"] += f"Date reported online was {convert_date(entry['fecha reporte web'])}. \n "

            if entry['Tipo recuperación'] == 'PCR':
                case["notes"] += f"Patient recovery was confirmed by a negative PCR test. \n "
            elif entry['Tipo recuperación'] == 'Tiempo':
                case["notes"] += f"Patient recovery was confirmed by 21 days elapsing with no symptoms. \n "

            yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
