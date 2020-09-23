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


import os
import sys
from datetime import date, datetime
import csv


private_public_map = {'Público': 'Public', 'Privado': 'Private'}


def convert_date(date_str: str):
    """
    Convert raw date field into a value interpretable by the dataserver.

    The date is listed in YYYY-mm-dd format
    """
    date = datetime.strptime(date_str, "%Y-%m-%d")

    return date.strftime("%m/%d/%Y")


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"


def convert_location(entry):
    '''
    The only information we have is the province where case was diagnosed/hospitalised
    '''
    if entry['carga_provincia_nombre']:
        return {"query": f"{entry['carga_provincia_nombre']}, Argentina"}
    else:
        return {"query": "Argentina"}


def convert_age(entry):
    '''
    Want to return a float specifying age in years. If age field is empty, return None
    '''
    if entry['edad']:
        if entry['edad_años_meses'] == 'Años':
            return float(entry['edad'])
        elif entry['edad_años_meses'] == 'Meses':
            return float(entry['edad']) / 12
    return None


def get_confirmed_event(entry):
    if entry['fecha_diagnostico']:
        confirmation_date = convert_date(entry['fecha_diagnostico'])
        note = 'Using Date of Diagnosis as the date of confirmation.'

    elif entry['fecha_inicio_sintomas']:
        confirmation_date = convert_date(entry['fecha_inicio_sintomas'])
        note = 'Using Date of Symptom Onset as the date of confirmation, because Date of Diagnosis is missing.'

    elif entry['fecha_apertura']:
        confirmation_date = convert_date(entry['fecha_apertura'])
        note = 'Using Date of Case Opening as the date of confirmation, because both Date of Diagnosis and Date of Symptom Onset are missing.'

    if 'Caso confirmado por laboratorio' in entry['clasificacion']:
        confirmed_value = 'Laboratory Test'
    elif 'Caso confirmado por criterio clínico-epidemiológico' in entry['clasificacion']:
        confirmed_value = 'Clinical Diagnosis'
    else:
        confirmed_value = 'Method Unknown'

    confirmed_event = {
        "name": "confirmed",
        "value": confirmed_value,
        "dateRange":
        {
            "start": confirmation_date,
            "end": confirmation_date
        }}

    return confirmed_event, note


def convert_residential_location(entry):
    '''
    This gets the residential address of the patient. Note this is not used to locate the case.
    '''
    query_terms = [term for term in [
        entry.get("residencia_provincia_nombre", ""),
        entry.get("residencia_departamento_nombre", ""),
        entry.get("residencia_pais_nombre", "")]
        if term]

    return ", ".join(query_terms)


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    We are currently only incorporating cases classified ('clasificacion_resumen') as 'Confirmed'. However,
    970k out of 1.5M cases are listed as 'Discarded', even though many have data values resembling confirmed
    Covid-19 patients, eg date_of_diagnosis, ICU_admission, mechanical breathing assistance. Future versions may
    want to modify this behaviour.

    For cases classified as Confirmed but lacking a Date of Diagnosis, we use Date of Symptom onset where present,
    and Date of Case Opening where neither Date of Diagnosis or Date of Symptom Onset are present.

    For case location, we use 'Province of case loading' (carga_provincia_nombre). This is where
    the laboratory tests were carried out, so may not always correspond to the exact location of the case, but is
    best proxy we have. The other location date refers to the residential address of the patient.

    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for entry in reader:
            notes = []
            if entry["clasificacion_resumen"] == "Confirmado":
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceEntryId": entry["id_evento_caso"],
                        "sourceUrl": source_url
                    },
                    "location": convert_location(entry),
                    "demographics": {
                        "ageRange": {
                            "start": convert_age(entry),
                            "end": convert_age(entry)
                        },
                        "gender": convert_gender(entry["sexo"])
                    }
                }

                confirmed_event, confirmation_note = get_confirmed_event(entry)
                case["events"] = [confirmed_event]
                notes.append(confirmation_note)

                if entry["fecha_inicio_sintomas"]:
                    case["symptoms"] = {
                        "status": "Symptomatic",
                    }
                    case["events"].append({
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": convert_date(entry['fecha_inicio_sintomas']),
                            "end": convert_date(entry['fecha_inicio_sintomas']),
                        }
                    })

                if entry["fecha_fallecimiento"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "Death",
                        "dateRange": {
                            "start": convert_date(entry['fecha_fallecimiento']),
                            "end": convert_date(entry['fecha_fallecimiento']),
                        }
                    })
                elif entry["fecha_internacion"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "hospitalAdmission",
                        "dateRange": {
                            "start": convert_date(entry['fecha_internacion']),
                            "end": convert_date(entry['fecha_internacion']),
                        }
                    })
                elif entry["fecha_cui_intensivo"]:
                    case["events"].append({
                        "name": "outcome",
                        "value": "icuAdmission",
                        "dateRange": {
                            "start": convert_date(entry['fecha_cui_intensivo']),
                            "end": convert_date(entry['fecha_cui_intensivo']),
                        }
                    })

                if 'no activo' in entry['clasificacion'].lower():
                    case["events"].append({
                        "name": "outcome",
                        "value": "Recovered"})
                    if 'No activo (por tiempo de evolución)' in entry['clasificacion']:
                        notes.append(
                            "Patient recovery was confirmed by a number of days elapsing with no symptoms.")
                    elif "No Activo por criterio de laboratorio" in entry['clasificacion']:
                        notes.append(
                            "Patient recovery was confirmed by a negative laboratory test.")

                notes.append(
                    f"Case was registered as being from {convert_residential_location(entry)}.")
                notes.append(
                    f"Case last updated on {convert_date(entry['ultima_actualizacion'])}.")
                if entry['origen_financiamiento'] in ['Público', 'Privado']:
                    notes.append(
                        f"Case was dealt with through {private_public_map[entry['origen_financiamiento']]} health system.")

                if entry['asistencia_respiratoria_mecanica'] == 'SI':
                    notes.append("Patient received mechanical ventilation.")
                if entry['clasificacion']:
                    notes.append(f"Diagnostic notes: {entry['clasificacion']}")

                case["notes"] = "\n".join(notes)
                yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
