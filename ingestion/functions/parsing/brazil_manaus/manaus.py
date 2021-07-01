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
            "common/python"))
    import parsing_lib

_AGE = "NU_IDADE_N"
_AGE_TYPE = "TP_IDADE"
_GENDER = "CS_SEXO"
_ETHNICITY = "CS_RACA"
_STATE = "SG_UF_NOT"
_MUNICIPALITY = "CO_MUN_NOT"
_DATE_CONFIRMED = "DT_NOTIFIC"
_COVID_CONFIRMED = "CLASSI_FIN"
_SEROLOGICAL_TEST_IGG = "RES_IGG"
_SEROLOGICAL_TEST_IGM = "RES_IGM"
_SEROLOGICAL_TEST_IGA = "RES_IGA"
_PCR_TEST = "PCR_SARS2"
_DATE_SYMPTOMS = "DT_SIN_PRI"
_PREGNANCY = "CS_GESTANT"
_FEVER = "FEBRE"
_COUGH = "TOSSE"
_SORE_THROAT = "GARGANTA"
_DYSPNEA = "DISPNEIA"
_BREATHING_DIFFICULTY = "DESC_RESP"
_LOW_OXYGEN = "SATURACAO"
_DIARRHOEA = "DIARREIA"
_VOMITING = "VOMITO"
_STOMACH_ACHE = "DOR_ABD"
_FATIGUE = "FADIGA"
_SMELL = "PERD_OLFT"
_TASTE = "PERD_PALA"
_HEART = "CARDIOPATI"
_HEMATOLOGIC = "HEMATOLOGI"
_DOWN_SYND = "SIND_DOWN"
_LIVER = "HEPATICA"
_ASTHMA = "ASMA"
_DIABETES = "DIABETES"
_NEUROLOGIC = "NEUROLOGIC"
_LUNG = "PNEUMOPATI"
_KIDNEY = "RENAL"
_OBESITY = "OBESIDADE"
_OTHER_COMORB = "MORB_DESC"
_HOSPITALIZED = "HOSPITAL"
_DATE_HOSP = "DT_INTERNA"
_ICU = "UTI"
_ICU_ENTRY = "DT_ENTUTI"
_ICU_DISCHARGE = "DT_SAIDUTI"
_OUTCOME = "EVOLUCAO"
_DATE_OUTCOME = "DT_EVOLUCA"
_TRAVEL_YN = "HISTO_VGM"
_TRAVEL_COUNTRY = "PAIS_VGM"
_TRAVEL_OUT = "DT_VGM"
_TRAVEL_RETURN = "DT_RT_VGM"

_COMORBIDITIES_MAP = {
    "DIABETES": "diabetes mellitus",
    "CS_GESTANT": "pregnancy",
    "RENAL": "chronic kidney disease",
    "CARDIOPATI": "heart disease",
    "OBESIDADE": "obesity",
    "SIND_DOWN": "Down syndrome",
    "HEPATICA": "liver disease",
    "ASMA": "asthma",
    "NEUROLOGIC": "nervous system disease",
    "PNEUMOPATI": "respiratory system disease",
}

_SYMPTOMS_MAP = {
    "PERD_PALA": "taste alteration",
    "PERD_OLFT": "smell alteration",
    "GARGANTA": "throat pain",
    "DISPNEIA": "dyspnea",
    "FEBRE": "fever",
    "TOSSE": "cough",
    # According to symptom ontology, breathing difficulty is exact synonym of dyspnea
    "DESC_RESP": "dyspnea",
    "SATURACAO": "hypoxemia",
    "DIARREIA": "diarrhoea",
    "VOMITO": "vomiting",
    "DOR_ABD": "abdominal discomfort",
    "FADIGA": "fatigue"
}

# 'UF_name' maps the UF (Unidade Federativa, admin level 1) codes to their respective names
# 'code_name_latlong' maps the municipality codes obtained from https://www.ibge.gov.br/en/geosciences/territorial-organization/territorial-meshes/2786-np-municipal-mesh/18890-municipal-mesh.html?=&t=acesso-ao-produto to respective name and lat/longs.The final digit is omitted as it is not included in the data.
# 'country_iso2' maps Spanish country names to their ISO-2 codes, and also includes common alternative spellings of country names as observed in data (e.g. lack of accents, common typos)
# 'country_translate_lat_long' maps country ISO-2 codes to longitude/latitude of country centroids, obtained from https://raw.githubusercontent.com/google/dspl/master/samples/google/canonical/countries.csv, as well as the corresponding country name in English
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dictionaries.json"), encoding='utf-8') as json_file:
    dictionaries = json.load(json_file)

_UF_NAME_MAP = dictionaries["UF_name"]

_CODE_NAME_LATLONG = dictionaries["code_name_latlong"]

_COUNTRY_ISO2_MAP = dictionaries["country_iso2"]

_COUNTRY_LAT_LONG_MAP = dictionaries['country_translate_lat_long']


# Date function for ADI and mongoimport format
def convert_date(raw_date: str, reference_date=None, dataserver=True, adi = True):
    """ 
    Convert raw date field into a value interpretable by the dataserver.

    Removing timestamp as always midnight.

    Set dataserver to False in order to return version appropriate for notes.

    Set adi to True to return version compatible with automated data ingestion

    Can supply a reference_date, so that any case with a date after this reference returns None
    A reference date of midnight on Feb 21st would only return cases up to the end of Feb 20th

    Hospitalization dates are sometimes given as dates in the future, which aren't allowed
    """
    today = datetime.now().date()
    if adi is False:
        if raw_date and datetime.strptime(raw_date, "%d/%m/%Y") < datetime.strptime(str(today), "%Y-%m-%d"):
            date = datetime.strptime(raw_date, "%d/%m/%Y")
            return {"$date": f"{date.isoformat()}Z"}
        if not dataserver:
            return date.strftime("%m/%d/%Y")
    else:
        if raw_date and datetime.strptime(raw_date, "%d/%m/%Y") < datetime.strptime(str(today), "%Y-%m-%d"):
            date = datetime.strptime(raw_date, "%d/%m/%Y")
            return date.strftime("%m/%d/%YZ")


def convert_location(state, municipality):
    location = {}
    geometry = {}
    location["country"] = "Brazil"
    location["administrativeAreaLevel1"] = _UF_NAME_MAP[state]
    location["administrativeAreaLevel2"] = _CODE_NAME_LATLONG[municipality]["name"]
    location["geoResolution"] = "Admin2"
    location["name"] = ", ".join([_CODE_NAME_LATLONG[municipality]["name"], _UF_NAME_MAP[state], "Brazil"])

    geometry["latitude"] = _CODE_NAME_LATLONG[municipality]["latitude"]
    geometry["longitude"] = _CODE_NAME_LATLONG[municipality]["longitude"]
    location["geometry"] = geometry
    return location


def convert_gender(raw_gender: str):
    if raw_gender == "M":
        return "Male"
    elif raw_gender == "F":
        return "Female"
    elif raw_gender == "I":
        return "Unknown"


def convert_test(serological_igg, serological_igm, serological_iga, pcr):
    if pcr == "1":
        return "PCR test"
    if any(i == "1" for i in [serological_igg, serological_igm, serological_iga]):
        return "Serological test"


def convert_events(date_confirmed, date_symptoms, serological_igg, serological_igm, serological_iga, pcr, hospitalized, date_hospitalized, icu, date_icu_entry, date_icu_discharge, outcome, date_outcome):
    events = [
        {
            "name": "confirmed",
            "dateRange": {
                "start": convert_date(date_confirmed),
                "end": convert_date(date_confirmed)
            },
            "value": convert_test(serological_igg, serological_igm, serological_iga, pcr)
        }
    ]
    if date_symptoms:
        events.append(
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": convert_date(date_symptoms),
                    "end": convert_date(date_symptoms)
                },
            }
        )
    if hospitalized == "1":
        events.append(
            {
                "name": "hospitalAdmission",
                "value": "Yes",
                "dateRange": {
                    "start": convert_date(date_hospitalized),
                    "end": convert_date(date_hospitalized)
                }
            }
        )
    elif hospitalized == "2":
        events.append(
            {
                "name": "hospitalAdmission",
                "value": "No"
            }
        )
    if icu == "1":
        events.append(
            {
                "name": "icuAdmission",
                "value": "Yes",
                "dateRange": {
                    "start": convert_date(date_icu_entry),
                    "end": convert_date(date_icu_discharge)
                }
            }
        )
    elif icu == "2":
        events.append(
            {
                "name": "icuAdmission",
                "value": "No"
            }
        )
    if outcome == "1":
        events.append(
            {
                "name": "outcome",
                "value": "Recovered",
                "dateRange": {
                    "start": convert_date(date_outcome),
                    "end": convert_date(date_outcome)
                }
            }
        )
    #outcome == 3 signifies death from other causes
    elif outcome == "2" or outcome == "3":
        events.append(
            {
                "name": "outcome",
                "value": "Death",
                "dateRange": {
                    "start": convert_date(date_outcome),
                    "end": convert_date(date_outcome)
                }
            }
        )
    return events


def convert_symptoms(taste, smell, throat, dyspnea, fever, cough, diff_breathing, hypoxemia, diarrhoea, vomiting, abdominal, fatigue):
    symptoms = {}
    if any([i=="1" for i in [taste, smell, throat, dyspnea, fever, cough, diff_breathing, hypoxemia, diarrhoea, vomiting, abdominal, fatigue]]):

        symptoms["status"] = "Symptomatic"
        values = []

        if taste == "1":
            values.append(_SYMPTOMS_MAP["PERD_PALA"])
        if smell == "1":
            values.append(_SYMPTOMS_MAP["PERD_OLFT"])
        if throat == "1":
            values.append(_SYMPTOMS_MAP["GARGANTA"])
        if dyspnea == "1":
            values.append(_SYMPTOMS_MAP["DISPNEIA"])
        if fever == "1":
            values.append(_SYMPTOMS_MAP["FEBRE"])
        if cough == "1":
            values.append(_SYMPTOMS_MAP["TOSSE"])
        if diff_breathing == "1":
            values.append(_SYMPTOMS_MAP["DESC_RESP"])
        if hypoxemia == "1":
            values.append(_SYMPTOMS_MAP["SATURACAO"])
        if diarrhoea == "1":
            values.append(_SYMPTOMS_MAP["DIARREIA"])
        if vomiting == "1":
            values.append(_SYMPTOMS_MAP["VOMITO"])
        if abdominal == "1":
            values.append(_SYMPTOMS_MAP["DOR_ABD"])
        if fatigue == "1":
            values.append(_SYMPTOMS_MAP["FADIGA"])

        if values:
            #Remove possible duplicate dyspnea entry
            symptoms["values"] = list(dict.fromkeys(values))

    return symptoms


def convert_preexisting_conditions(diabetes, pregnancy, kidney, heart, obesity, down, liver, asthma, nervous, respiratory, other):
    preexistingConditions = {}
    values = []

    if diabetes == "1":
        values.append(_COMORBIDITIES_MAP["DIABETES"])
    if any([pregnancy == i for i in ["1", "2", "3", "4"]]):
        values.append(_COMORBIDITIES_MAP["CS_GESTANT"])
    if kidney == "1":
        values.append(_COMORBIDITIES_MAP["RENAL"])
    if heart == "1":
        values.append(_COMORBIDITIES_MAP["CARDIOPATI"])
    if obesity == "1":
        values.append(_COMORBIDITIES_MAP["OBESIDADE"])
    if down == "1":
        values.append(_COMORBIDITIES_MAP["SIND_DOWN"])
    if liver == "1":
        values.append(_COMORBIDITIES_MAP["HEPATICA"])
    if asthma == "1":
        values.append(_COMORBIDITIES_MAP["ASMA"])
    if nervous == "1":
        values.append(_COMORBIDITIES_MAP["NEUROLOGIC"])
    if respiratory == "1":
        values.append(_COMORBIDITIES_MAP["PNEUMOPATI"])
    if other:
        values.append(str('other comorbidity listed as: ' + other))

    if values:
        preexistingConditions["hasPreexistingConditions"] = True
        preexistingConditions["values"] = values
        return preexistingConditions


def convert_demographics(gender: str, age: str, age_type, ethnicity):
    demo = {}
    demo["gender"] = convert_gender(gender)
    # 3 indicates an age in years
    if age_type == "3":
        demo["ageRange"] = {"start": float(age), "end": float(age)}
    # 2 indicates an age in months
    elif age_type == "2":
        demo["ageRange"] = {"start": float(age)/12, "end": float(age)/12}
    # 1 indicates an age in days; 365.25 is average number of days a year
    elif age_type == "1":
        demo["ageRange"] = {"start": float(age)/365.25, "end": float(age)/365.25}
    demo["ethnicity"] = convert_ethnicity(ethnicity)
    return demo


def convert_ethnicity(ethnicity: str):
    if ethnicity == "2":
        return "Black"
    elif ethnicity == "4":
        return "Mixed"
    elif ethnicity == "3":
        return "Asian"
    elif ethnicity == "1":
        return "White"
    elif ethnicity == "5":
        return "Indigenous"


def convert_travel(travel_yn, travel_country, travel_out, travel_in):
    '''
    International travel within 14 days before symptoms appeared is recorded.
    '''
    if travel_yn == "1":
        location = {}
        geometry = {}
        travel = {}
        travel_countries = []
        country = travel_country
        
        country_ISO2 = _COUNTRY_ISO2_MAP[country.lower()]

        location["country"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["name_english"]
        location["geoResolution"] = "Country"
        location["name"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["name_english"]
        geometry["latitude"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["latitude"]
        geometry["longitude"] = _COUNTRY_LAT_LONG_MAP[country_ISO2]["longitude"]
        location["geometry"] = geometry

        travel_countries.append({"location": location})
        travel["traveledPrior30Days"] = True
        travel["travel"] = travel_countries
        travel["dateRange"] = {"start": convert_date(travel_out), "end": convert_date(travel_in)}
        if travel:
            return travel


def convert_notes(outcome):
    raw_notes = []
    if outcome == "3":
        raw_notes.append("Patient died from other causes")
    if raw_notes:
        return (", ").join(raw_notes)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            confirmation_date = convert_date(row[_DATE_CONFIRMED])
            if confirmation_date is not None and row[_COVID_CONFIRMED] == "5":
                try:
                    case = {
                        "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                        "location": convert_location(row[_STATE], row[_MUNICIPALITY]),
                        "events": convert_events(
                            row[_DATE_CONFIRMED],
                            row[_DATE_SYMPTOMS],
                            row[_SEROLOGICAL_TEST_IGG],
                            row[_SEROLOGICAL_TEST_IGM],
                            row[_SEROLOGICAL_TEST_IGA],
                            row[_PCR_TEST],
                            row[_HOSPITALIZED],
                            row[_DATE_HOSP],
                            row[_ICU],
                            row[_ICU_ENTRY],
                            row[_ICU_DISCHARGE],
                            row[_OUTCOME],
                            row[_DATE_OUTCOME]
                        ),
                        "symptoms": convert_symptoms(
                            row[_TASTE],
                            row[_SMELL],
                            row[_SORE_THROAT],
                            row[_DYSPNEA],
                            row[_FEVER],
                            row[_COUGH],
                            row[_BREATHING_DIFFICULTY],
                            row[_LOW_OXYGEN],
                            row[_DIARRHOEA],
                            row[_VOMITING],
                            row[_STOMACH_ACHE],
                            row[_FATIGUE],
                        ),
                        "demographics": convert_demographics(
                            row[_GENDER], row[_AGE], row[_AGE_TYPE], row[_ETHNICITY]
                        ),
                        "preexistingConditions": convert_preexisting_conditions(
                            row[_DIABETES],
                            row[_PREGNANCY],
                            row[_KIDNEY],
                            row[_HEART],
                            row[_OBESITY],
                            row[_DOWN_SYND],
                            row[_LIVER],
                            row[_ASTHMA],
                            row[_NEUROLOGIC],
                            row[_LUNG],
                            row[_OTHER_COMORB]
                        ),
                        "travelHistory": convert_travel(
                            row[_TRAVEL_YN],
                            row[_TRAVEL_COUNTRY],
                            row[_TRAVEL_OUT],
                            row[_TRAVEL_RETURN]
                        )
                    }
                    notes = convert_notes(
                        row[_OUTCOME]
                    )
                    if notes:
                        case["notes"] = notes
                    yield case
                except ValueError as ve:
                    raise ValueError(f"error converting case: {ve}")


def event_handler(event):
    return parsing_lib.run(event, parse_cases)
