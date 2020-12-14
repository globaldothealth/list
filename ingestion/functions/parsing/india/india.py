import copy
import csv
import os
import sys
from datetime import datetime

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

    The date is listed in dd/mm/YYYY format, but the data server API will
    assume that ambiguous cases (e.g. "05/06/2020") are in mm/dd/YYYY format.
    """
    date = datetime.strptime(raw_date, "%d/%m/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender):
    if raw_gender == "M":
        return "Male"
    if raw_gender == "F":
        return "Female"


def convert_location(row):
    state = row["Detected State"]
    district = row["Detected District"]
    city = row["Detected City"]

    query_terms = ("India",)
    resolutions = ["Country"]
    if state:
        query_terms = (state,) + query_terms
        resolutions.insert(0, "Admin1")
    if district:
        query_terms = (district,) + query_terms
        resolutions.insert(0, "Admin2")
    if city:
        query_terms = (city,) + query_terms
        resolutions.insert(0, "Admin3")

    return {
        "query": ", ".join(query_terms),
        "limitToResolution": ",".join(resolutions)
    }


def convert_demographics(row):
    demo = {}

    if row["Age Bracket"]:
        raw = row["Age Bracket"]
        # Handle ranges, e.g. "28-35"
        if "-" in raw:
            parts = raw.split("-", 1)
            demo["ageRange"] = {
                "start": float(parts[0]),
                "end": float(parts[1])
            }
        # Handle months, e.g. "6 months"
        elif " months" in raw.lower():
            age = float(raw.split(" ", 1)[0]) / 12
            demo["ageRange"] = {
                "start": age,
                "end": age
            }
        # Handle standard ages
        else:
            age = float(raw)
            demo["ageRange"] = {
                "start": age,
                "end": age
            }
    if row["Gender"]:
        demo["gender"] = convert_gender(row["Gender"])
    if row["Nationality"]:
        demo["nationalities"] = [row["Nationality"]]

    return demo or None


def convert_sources(row):
    # Sources must be unique, per our case schema.
    included = set()
    additionalSources = [{"sourceUrl": row[col]}
                         for col in ["Source_1", "Source_2", "Source_3"]
                         if row[col] and
                         row[col] not in included and not included.add(
                             row[col])]
    return additionalSources or None


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data."""
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Rows with a status of Hospitalized are new, confirmed cases.
            # Unfortunately, while other statuses sometimes contain interesting
            # information, we don't have a way to reliably collate these with
            # their respective confirmations.
            if row["Current Status"] != "Hospitalized":
                continue

            # The column used to denote case UUID changes in April.
            # It resets back to 1 when this happens.
            # Prefix old values ("Patient Number") to distinguish.
            if "Entry_ID" in row:
                uuid_column = "Entry_ID"
                uuid_prefix = "Entry-"
            else:
                uuid_column = "Patient Number"
                uuid_prefix = "Patient-"

            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url,
                    "additionalSources": convert_sources(row)
                },
                "location": convert_location(row),
                # While case confirmation is represented by "Hospitalized," it
                # isn't clear that this is semantically accurate for new data.
                # At the onset, cases were likely confirmed via
                # hospitalization, but it's now likely inaccurate to claim as
                # much for the entirety of confirmed cases.
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                            {
                                "start": convert_date(row["Date Announced"]),
                                "end": convert_date(row["Date Announced"])
                            }
                    }
                ],
                "demographics": convert_demographics(row),
                "notes": row["Notes"] or None
            }
            for i in range(int(row["Num Cases"])):
                c = copy.deepcopy(case)
                c["caseReference"]["sourceEntryId"] = f"{uuid_prefix}{row[uuid_column]}-{i + 1}"
                yield c


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
