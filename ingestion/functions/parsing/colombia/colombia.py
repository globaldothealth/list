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


def convert_date(raw_date: str, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.

    Removing timestamp as always midnight.

    Set dataserver to False in order to return version appropriate for notes.
    """
    date = datetime.strptime(raw_date.split(' ')[0], "%d/%m/%Y")
    if not dataserver:
        return date.strftime("%m/%d/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"
    return None


def convert_location(raw_entry):
    query_terms = [
        term for term in [
            raw_entry.get("Nombre municipio", ""),
            raw_entry.get("Nombre departamento", ""),
            "Colombia"]
        if term != '']

    return {"query": ", ".join(query_terms)}


def convert_demographics(entry):
    '''
    This takes a whole row, and returns Age, Gender and Ethnicity in a dictionary.
    Age is given as an int, but the adjacent field, 'Age Measurement Unit', determines what this int represents.
    1 = Years; 2 = Months; 3 = Days
    '''

    ethnicity_map = {'1': 'Indigenous',
                     '2': 'ROM',
                     '3': 'Raizal',
                     '4': 'Palenquero',
                     '5': 'Black',
                     '6': 'Other'}

    demo = {}
    if entry['Edad']:
        if str(entry['Unidad de medida de edad']) == '1':
            demo["ageRange"] = {
                "start": float(entry['Edad']),
                "end": float(entry['Edad'])
            }
        elif str(entry['Unidad de medida de edad']) == '2':
            demo["ageRange"] = {
                "start": float(entry['Edad']) / 12,
                "end": float(entry['Edad']) / 12
            }
        elif str(entry['Unidad de medida de edad']) == '3':
            demo["ageRange"] = {
                "start": float(entry['Edad']) / 365,
                "end": float(entry['Edad']) / 365
            }
    if entry['Sexo']:
        demo["gender"] = convert_gender(entry['Sexo'])

    if entry['Pertenencia étnica']:
        ethnicity = ethnicity_map.get(str(entry['Pertenencia étnica']), "")
        if entry['Nombre del grupo étnico']:
            ethnicity += f", {entry['Nombre del grupo étnico']}"
    else:
        ethnicity = 'Unknown'
    demo["ethnicity"] = ethnicity

    return demo or None


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Caveats:
    - Assuming the date confirmed is the date of diagnosis (Fecha diagnostico) rather than
    Fecha de notificación (generally several days earlier). When date of diagnosis, using date reported online as proxy.

    - Notes added include date reported online and date that SIVIGILA (national health alert system) was notiifed.
    Also whether case was imported, and how patient recovery was confirmed.

    - Tipo recuperación refers to how they decided the patient had recovered: either by 21 days elapsing since
    symptoms, or a negative PCR/antigen test


    - No dates for travel history, only distinction is between cases of type: 'Importado' vs. 'Relacionado'

    """

    symptom_map = {'leve': 'Mild',
                   'moderado': 'Moderate',
                   'grave': 'Serious'}

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            notes = []
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceEntryId": entry["ID de caso"],
                    "sourceUrl": source_url
                },
                "location": convert_location(entry),
                "demographics": convert_demographics(entry)
            }

            if entry["Fecha de diagnóstico"] != '':
                case["events"] = [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(entry["Fecha de diagnóstico"]),
                            "end": convert_date(entry["Fecha de diagnóstico"])
                        }
                    },
                ]
            else:
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
                notes.append(
                    "No Date of Diagnosis provided, so using Date Reported Online (fecha reporte web) as a proxy. This is normally approx. 1 week later.")

            # If patient was symptomatic, mark date of onsetSymptoms, otherwise
            # asymptomatic
            # maybe change to elif clause and check if can parse field as date
            if entry["Fecha de inicio de síntomas"]:
                case["symptoms"] = {
                    "status": "Symptomatic",
                }
                case["events"].append({
                    "name": "onsetSymptoms",
                    "dateRange": {
                        "start": convert_date(entry['Fecha de inicio de síntomas']),
                        "end": convert_date(entry['Fecha de inicio de síntomas']),
                    }
                })

            else:
                case["symptoms"] = {
                    "status": "Asymptomatic",
                }

            # Include severity of symptoms
            if entry["Estado"].lower() in symptom_map.keys():
                case["symptoms"]["values"] = [
                    symptom_map.get(entry['Estado'].lower())]

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
                    notes.append("Did not die from Covid-19.")

            if entry["Recuperado"].lower() == "recuperado":
                case["events"].append({
                    "name": "outcome",
                    "value": "Recovered",
                    "dateRange": {
                        "start": convert_date(entry['Fecha de recuperación']),
                        "end": convert_date(entry['Fecha de recuperación']),
                    }
                })
            if entry["Ubicación del caso"].lower() == "hospital":
                case["events"].append({
                    "name": "hospitalAdmission",
                    "value": "Yes"
                })
            if entry["Ubicación del caso"].lower() == 'hospital uci':
                case["events"].append({
                    "name": "icuAdmission",
                    "value": "Yes"
                })

            if entry["Ubicación del caso"].lower() == 'casa':
                notes.append("Patient self-isolated and recovered at home.")

            # Add notes for each case
            # Travel History - we currently do not have any travel dates, so
            # unknown whether in last 30 days
            if entry["Tipo de contagio"].lower() == "importado":
                notes.append(
                    f"Case is reported as importing the disease into Colombia, and country of origin is {entry['Nombre del país']}.")
            elif entry["Tipo de contagio"].lower() == 'relacionado':
                notes.append("Case was transmitted within Colombia.")
            elif entry["Tipo de contagio"].lower() == 'en estudio':
                notes.append(
                    "Case transmission under investigation (currently unknown).")

            if entry['fecha reporte web']:
                notes.append(
                    f"Date reported online was {convert_date(entry['fecha reporte web'],dataserver=False)}.")
            if entry['Fecha de notificación']:
                notes.append(
                    f"Date reported to SIVIGILA was {convert_date(entry['Fecha de notificación'],dataserver=False)}.")

            if entry['Tipo de recuperación'] == 'PCR':
                notes.append(
                    f"Patient recovery was confirmed by a negative PCR test.")
            elif entry['Tipo de recuperación'] == 'Tiempo':
                notes.append(
                    f"Patient recovery was confirmed by 21 days elapsing with no symptoms.")

            if notes:
                case["notes"] = " \n".join(notes)

            yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
