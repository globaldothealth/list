#!/usr/bin/python3
# Transforms a CSV dump from mongoexport (see export.sh) into the CSV
# format usable for country exports
# The CSV file is read from stdin, with the processed CSV file written
# to stdout

import sys
import csv
import json
import logging
from functools import reduce
from typing import Any, Optional

logging.basicConfig(filename="transform.log", level=logging.INFO)


__ARRAYS = [
    "caseReference.uploadIds",
    "demographics.nationalities",
    "symptoms.values",
    "preexistingConditions.values",
    "transmission.linkedCaseIds",
    "transmission.places",
    "transmission.routes",
    "pathogens",
]

__OMIT = [
    "location.query",
    "revisionMetadata.creationMetadata.curator",
    "revisionMetadata.editMetadata.curator",
    "events",
    "travelHistory.travel",
]

__TRAVEL = [
    "travelHistory.travel.dateRange.end",
    "travelHistory.travel.dateRange.start",
    "travelHistory.travel.location.administrativeAreaLevel1",
    "travelHistory.travel.location.administrativeAreaLevel2",
    "travelHistory.travel.location.administrativeAreaLevel3",
    "travelHistory.travel.location.country",
    "travelHistory.travel.location.geoResolution",
    "travelHistory.travel.location.geometry.coordinates",
    "travelHistory.travel.location.name",
    "travelHistory.travel.location.place",
    "travelHistory.travel.methods",
    "travelHistory.travel.purpose",
]

__GENOME = [
    "genomeSequences.sampleCollectionDate",
    "genomeSequences.repositoryUrl",
    "genomeSequences.sequenceId",
    "genomeSequences.sequenceName",
    "genomeSequences.sequenceLength",
]

__VARIANT = ["variantOfConcern"]


def deep_get(dictionary: dict[str, Any], keys: str, default="") -> Any:
    """
    Retrieve values from nested dictionaries
    """
    return reduce(
        lambda d, key: d.get(key, default) if isinstance(d, dict) else default,
        keys.split("."),
        dictionary,
    )


def convert_date(date_string: str) -> Optional[str]:
    if date_string:
        return date_string[:10]


def convert_event(event: dict[str, Any]) -> dict[str, Any]:
    """
    Process individual events in the events array.

    Returns an unnested dictionary.
    """
    suffix = event["name"]
    col_name = f"events.{suffix}"

    return {
        f"{col_name}.value": event.get("value"),
        f"{col_name}.date": convert_date(deep_get(event, "dateRange.end.$date")),
    }


def convert_addl_sources(sources_string: str) -> str:
    if sources_string == "[]":
        return None
    sources_array = json.loads(sources_string)
    source_urls = [x["sourceUrl"] for x in sources_array]
    return ",".join(source_urls)


def convert_string_list(item: str) -> Optional[str]:
    """
    Converts text list into comma-separated string.
    """
    try:
        if (type(item) != str) or (item == "") or (item == "[]"):
            return None
        if type(j := json.loads(item)) == list:
            return ",".join(map(str, j))
        else:
            return item
    except Exception as e:
        logging.error("Couldn't convert list.")
        logging.error(e)
        logging.error(item)
        return item


def convert_travel(travel_array: str) -> dict[str, Any]:
    if travel_array == "[]":
        return {k: None for k in __TRAVEL}
    try:
        travel_array = json.loads(travel_array)
        travel_dict = {}
        logging.info("Processing travel arrays...")
        for field in set(__TRAVEL) - {
            "travelHistory.travel." + f
            for f in [
                "dateRange.end",
                "dateRange.start",
                "location.geometry.coordinates",
                "methods",
            ]
        }:
            unnest = field.removeprefix("travelHistory.travel.")
            print(unnest)
            items = [deep_get(x, unnest) for x in travel_array]
            if any(i for i in items):
                travel_dict[field] = ",".join(items)
        logging.info("Travel arrays processed, processing dates...")
        for _d in ("start", "end"):
            if dates := [
                convert_date(deep_get(x, f"dateRange.{_d}"))
                for x in travel_array
                if "dateRange" in x.keys()
            ]:
                travel_dict[f"travelHistory.travel.dateRange.{_d}"] = ",".join(dates)
        logging.info("Travel dates processed, processing methods...")
        if methods := [str(x["methods"]) for x in travel_array if x.get("methods", [])]:
            travel_dict["travelHistory.travel.methods"] = ",".join(methods)
        logging.info("Travel methods processed, processing coordinates...")
        try:
            travel_dict[
                "travelHistory.travel.location.geometry.coordinates"
            ] = ",".join(
                [
                    str(
                        (
                            deep_get(x, "location.geometry.latitude"),
                            deep_get(x, "location.geometry.longitude"),
                        )
                    )
                    for x in travel_array
                ]
            )
        except Exception:
            logging.error("No coordinates found.")
        logging.info("Coordinates processed!")
        return travel_dict
    except Exception as e:
        logging.error("Couldn't convert travel.")
        logging.error(e)
        logging.error(travel_array)
        return {k: None for k in __TRAVEL}


def get_fields(fileobject) -> list[str]:
    """
    Add processed event fieldnames to fields.
    """
    reader = csv.DictReader(fileobject)
    row = next(reader)
    headers = list(row.keys())
    cols_to_add = []
    for col_name in [
        "confirmed",
        "firstClinicalConsultation",
        "hospitalAdmission",
        "icuAdmission",
        "onsetSymptoms",
        "outcome",
        "selfIsolation",
    ]:
        cols_to_add.extend([f"events.{col_name}.value", f"events.{col_name}.date"])

    fields = set(headers).union(set(cols_to_add))
    fields = fields.union(set(__TRAVEL + __GENOME + __VARIANT))
    fields = sorted(list(fields - set(__OMIT)))
    return headers, fields


def convert_row(row: dict[str, Any]) -> Optional[dict[str, Any]]:
    if "ObjectId" not in row["_id"]:
        return None
    if type(row["notes"]) == str:
        row["notes"] = row["notes"].replace("\n", ", ")
    for arr_field in __ARRAYS:
        if row[arr_field]:
            row[arr_field] = convert_string_list(row[arr_field])
    if row["caseReference.additionalSources"]:
        row["caseReference.additionalSources"] = convert_addl_sources(
            row["caseReference.additionalSources"]
        )
    if row.get("events", None):
        for e in json.loads(row["events"]):
            row.update(convert_event(e))
    if row["travelHistory.traveledPrior30Days"] == "true":
        if "travelHistory.travel" in row:
            row.update(convert_travel(row["travelHistory.travel"]))
    return row


def parse():
    headers, fields = get_fields(sys.stdin)
    reader = csv.DictReader(sys.stdin, fieldnames=headers)
    writer = csv.DictWriter(sys.stdout, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in reader:
        writer.writerow(convert_row(row))


if __name__ == "__main__":
    parse()
