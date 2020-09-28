import os
import sys
from datetime import datetime
import json
import pycountry

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
    Dates are listed in YYYY/mm/dd format
    """
    date = datetime.strptime(raw_date, "%Y/%m/%d")
    return date.strftime("%m/%d/%Y")


def convert_gender(raw_gender):
    if raw_gender == "hombre":
        return "Male"
    if raw_gender == "mujer":
        return "Female"
    return None


def convert_location(raw_entry):
    query_terms = [
        term for term in [
            raw_entry.get("municipio_detección", ""),
            raw_entry.get("provincia_detección", ""),
            "Cuba"]
        if term]

    return {"query": ", ".join(query_terms)}


def convert_nationality(two_letter_country_code):
    if two_letter_country_code == 'cu':
        return "Cuban"
    else:
        country = pycountry.countries.get(alpha_2=two_letter_country_code).name
        if country:
            return country


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.

    Nationality of case is provided in two letter country codes, so using pycountry package to parse these

    The field 'posible_procedencia_contagio' is generally populated by two letter country codes. Case is assumed to have travelled
    from one of these countries in last 30 days if populated.

    Diagnostic centre and treatment hospital are both included in notes for now, could be geocoded in future.

    Currently no parsing of symptoms, as field is always left empty - worth rechecking this in future in case this field
    becomes populated. No disease outcome data is provided either.

    """
    with open(raw_data_file, "r") as f:
        json_data = json.load(f)
        # First make dict mapping code names of diagnostic and treament centers
        # to actual locations
        hospital_map = {}
        for centre_type in ['centros_aislamiento', 'centros_diagnostico']:
            for centre in json_data[centre_type]:
                hospital_map[centre] = json_data[centre_type][centre]['nombre'] + \
                    ", " + json_data[centre_type][centre]['provincia']

        for day in json_data['casos']['dias']:
            if 'diagnosticados' in json_data['casos']['dias'][day]:
                fecha = json_data['casos']['dias'][day]['fecha']
                for entry in json_data['casos']['dias'][day]['diagnosticados']:
                    notes = []
                    case = {
                        "caseReference": {
                            "sourceId": source_id,
                            "sourceEntryId": entry["id"],
                            "sourceUrl": source_url},
                        "location": convert_location(entry),
                        "events": [
                            {
                                "name": "confirmed",
                                "dateRange": {
                                    "start": convert_date(fecha),
                                    "end": convert_date(fecha)}}],
                        "demographics": {
                            "ageRange": {
                                "start": float(
                                    entry["edad"]),
                                "end": float(
                                    entry["edad"])},
                            "gender": convert_gender(
                                entry["sexo"]),
                            "nationalities": [
                                convert_nationality(
                                    entry['pais'])]}}

                    if entry.get("consulta_medico", ""):
                        try:
                            case["events"].append({
                                "name": "firstClinicalConsultation",
                                "dateRange": {
                                    "start": convert_date(entry["consulta_medico"]),
                                    "end": convert_date(entry["consulta_medico"])
                                }}
                            )
                        except BaseException:
                            pass

                    if entry.get('posible_procedencia_contagio', ""):
                        if 'crucero' in entry['posible_procedencia_contagio']:
                            case["transmission"] = {"places": "Cruise Ship"}

                        elif len(entry['posible_procedencia_contagio'][0]) == 2:
                            for two_letter_country_code in entry['posible_procedencia_contagio']:
                                if pycountry.countries.get(
                                        alpha_2=two_letter_country_code):
                                    country = pycountry.countries.get(
                                        alpha_2=two_letter_country_code).name
                                    if country:
                                        case["travelHistory"] = {
                                            "traveledPrior30Days": True,
                                            "travel": [
                                                {
                                                    "location": {
                                                        "query": "Cuba"
                                                    }
                                                }]
                                        }
                
                                        if entry.get('arribo_a_cuba_foco', ""):
                                            notes.append(
                                                f"Case arrived in Cuba from {country} on {convert_date(entry['arribo_a_cuba_foco'])}")

                    if entry.get('contagio', "") == 'introducido':
                        notes.append(
                            "Case was transmitted from another confirmed case within Cuba.")
                    elif entry.get('contagio', "") == 'importado':
                        notes.append(
                            "Case was contracted abroad and brought into Cuba.")

                    if '-1' in entry['id']:
                        notes.append(
                            "First patient from this country in Cuba.")

                    if entry.get("centro_diagnostico", ""):
                        notes.append(
                            f"Case diagnostic test was performed at {hospital_map.get(entry['centro_diagnostico'],'Unknown Centre')}.")
                    if entry.get("centro_aislamiento", ""):
                        notes.append(
                            f"Case was treated at {hospital_map.get(entry['centro_aislamiento'],'Unknown Hospital')}.")

                    if entry.get("contacto_focal", ""):
                        notes.append(
                            f"A further {entry['contacto_focal']} people who this case was in contact with are being monitored for symptoms")

                    if entry['info']:
                        notes.append(
                            f"Notes provided are as follows: \n {entry['info']}")

                    case["notes"] = "\n".join(notes)

                    yield case


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
