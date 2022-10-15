#!/usr/bin/python3
# Transforms a CSV dump from mongoexport (see export.sh) into the CSV
# format usable for country exports
# The CSV file is read from stdin, with the processed CSV file written
# to stdout

import io
import argparse
from contextlib import contextmanager
import csv
from functools import reduce
import gzip
import json
import logging
from pathlib import Path
import sys
from typing import Any, Optional

from logger import setup_logger

MINIMUM_AGE_WINDOW = 5

VALID_FORMATS = ["csv", "tsv", "json"]

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
    "notes",
    "travelHistory.travel",
    "caseReference.sourceEntryId"
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

    flattened_event = {
        f"{col_name}.date": convert_date(deep_get(event, "dateRange.end.$date")),
    }
    if suffix not in ["selfIsolation", "onsetSymptoms", "firstClinicalConsultation"]:
        flattened_event[f"{col_name}.value"] = event.get("value")
    return flattened_event


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


def get_headers_and_fields(fileobject) -> list[str]:
    """
    Add processed event fieldnames to fields.
    """
    try:
        headers = fileobject.readline().strip().split(",")
    except Exception as e:
        logging.exception("Error in reading mongoexport header")
        sys.exit(1)
    cols_to_add = [
        "demographics.ageRange.start",
        "demographics.ageRange.end",
        "events.confirmed.value",
        "events.confirmed.date",
        "events.firstClinicalConsultation.date",
        "events.hospitalAdmission.date",
        "events.hospitalAdmission.value",
        "events.icuAdmission.date",
        "events.icuAdmission.value",
        "events.onsetSymptoms.date",
        "events.outcome.date",
        "events.outcome.value",
        "events.selfIsolation.date",
    ]
    cols_to_remove = [
        "demographics.ageBuckets",
    ]
    fields = set(headers).union(set(cols_to_add))
    fields = fields.union(set(__TRAVEL + __VARIANT))
    fields = fields.difference(cols_to_remove)
    fields = sorted(list(fields - set(__OMIT)), key=str.casefold)
    return headers, fields

def get_age_bucket_as_range(buckets: list[dict[str]], age_start: int, age_end: int) -> Optional[tuple[int, int]]:
    "Returns age bucket from demographics.ageRange.start and demographics.ageRange.end"

    def which_bucket(age: int) -> int:
        for i, bucket in enumerate(buckets):
            if bucket["start"] <= age <= bucket["end"]:
                return i
        return -1

    index_bucket_start = which_bucket(int(age_start))
    index_bucket_end = which_bucket(int(age_end))
    if index_bucket_start < 0 or index_bucket_end < 0:
        return None
    bounds = [buckets[index_bucket_start]["start"], buckets[index_bucket_end]["start"],
              buckets[index_bucket_start]["end"], buckets[index_bucket_end]["end"]]
    return (min(bounds), max(bounds))

def age_range(case_buckets: str, buckets: list[dict[str, Any]]) -> tuple[int, int]:
    bucket_ids = json.loads(case_buckets)
    matching_buckets = [b for b in buckets if b["_id"] in bucket_ids]
    min_age = min([b["start"] for b in matching_buckets])
    max_age = max([b["end"] for b in matching_buckets])
    return (min_age, max_age)


def convert_age(row: dict[str, Any], buckets: list[dict[str, Any]]) -> Optional[tuple[int, int]]:
    """
    Converts age information from CSV row to age bounds

    To handle the transition from ageRange to ageBuckets, convert_age()
    support both, with a preference to ageBuckets if that field exists.

    There are three scenarios that are handled:

    1. demographics.ageBuckets is present. This is the preferred option and
       the code sets the minimum and maximum of the buckets present as the age
       range

    2. demographics.ageRange is present and the age window (difference
       between the maximum and minimum is at least MINIMUM_AGE_WINDOW. In this
       case, this is passed unchanged for export.

    3. demographics.ageRange has a age window below MINIMUM_AGE_WINDOW. In
       this case the code matches it to the nearest age bucket(s).
    """
    age_buckets = row.get("demographics.ageBuckets")
    if age_buckets and age_buckets != "[]":
        return age_range(age_buckets, buckets)

    # ensure demographics.ageRange is present
    if not (
        row.get("demographics.ageRange.start") and
        row.get("demographics.ageRange.end")
    ):
        return None

    age_start = int(float(row["demographics.ageRange.start"]))
    age_end = int(float(row["demographics.ageRange.end"]))
    age_window = age_end - age_start + 1

    if age_window >= MINIMUM_AGE_WINDOW:
        return age_start, age_end
    elif bucketed_age_range := get_age_bucket_as_range(buckets, age_start, age_end):
        return bucketed_age_range
    else:
        return None


def convert_row(row: dict[str, Any], buckets: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    "Converts row for export using age buckets"

    if "ObjectId" not in row["_id"]:
        return None
    for arr_field in __ARRAYS:
        if row.get(arr_field):
            row[arr_field] = convert_string_list(row[arr_field])
    if row.get("caseReference.additionalSources"):
        row["caseReference.additionalSources"] = convert_addl_sources(
            row["caseReference.additionalSources"]
        )
    if not row.get("SGTF"):
        row["SGTF"] = "NA"
    if row.get("events", None):
        for e in json.loads(row["events"]):
            row.update(convert_event(e))
    if row["travelHistory.traveledPrior30Days"] == "true":
        if "travelHistory.travel" in row:
            row.update(convert_travel(row["travelHistory.travel"]))
    if age_bounds := convert_age(row, buckets):
        row["demographics.ageRange.start"], row["demographics.ageRange.end"] = age_bounds
    return row


class JSONWriter:
    "JSON Writer class similar to csv.DictWriter"
    def __init__(self, file: io.TextIOBase, fieldnames: list[str]):
        self.file = file
        self.fieldnames = fieldnames

    def writeheader(self):
        self.file.write("[\n")

    def writerow(self, row: dict[str, Any], row_number: int):
        row_to_write = {field: row.get(field, "") for field in self.fieldnames}
        tok = ", " if row_number > 0 else "  "
        self.file.write(tok + json.dumps(row_to_write, sort_keys=True) + "\n")


def writerow(
    formats: list[str], writers: dict[str, Any], row: dict[str, Any], row_number: int
):
    for fmt in formats:
        if row_number == 0:  # first row, write header
            writers[fmt].writeheader()
        if fmt == "json":
            writers[fmt].writerow(row, row_number)
        else:
            writers[fmt].writerow(row)


@contextmanager
def open_writers(formats: list[str], fields: list[str], output: str):
    if unknown_formats := set(formats) - set(VALID_FORMATS):
        raise ValueError(f"Unknown formats passed: {unknown_formats}")
    files = {}
    writers = {}
    for fmt in formats:
        files[fmt] = (
            gzip.open(f"{output}.{fmt}.gz", "wt")
            if output != "-" else sys.stdout
        )
        if fmt == "csv":
            writers[fmt] = csv.DictWriter(
                files[fmt], fieldnames=fields, extrasaction="ignore"
            )
        if fmt == "tsv":
            writers[fmt] = csv.DictWriter(
                files[fmt], fieldnames=fields, extrasaction="ignore", delimiter="\t"
            )
        if fmt == "json":
            writers[fmt] = JSONWriter(files[fmt], fieldnames=fields)
    try:
        yield writers
    except Exception as e:
        logging.exception(f"Error occurred in open_writers(): {e}")
    finally:
        if output == "-":
            if formats == ["json"]:
                print("]")
            return
        for fmt in formats:
            if fmt == "json":
                files[fmt].write("]\n")
            files[fmt].close()


def transform(input: Optional[str], output: str, formats: list[str], bucketpath: str):
    with (open(input) if input else sys.stdin) as inputfile:
        with open(bucketpath) as bucketfile:
            buckets = json.load(bucketfile)
            headers, fields = get_headers_and_fields(inputfile)
            reader = csv.DictReader(inputfile, fieldnames=headers)
            hasrows = False
            with open_writers(formats, fields, output) as writers:
                for i, row in enumerate(map(lambda row: convert_row(row, buckets), reader)):
                    hasrows = True
                    writerow(formats, writers, row, i)
            if output != "-" and not hasrows:  # cleanup empty files
                cleanup_files = [Path(f"{output}.{fmt}.gz") for fmt in formats]
                for file in cleanup_files:
                    file.unlink(missing_ok=True)


if __name__ == "__main__":
    setup_logger()
    parser = argparse.ArgumentParser()
    parser.add_argument("output", help="Output file stem to use (extension is added), specify - for stdout")
    parser.add_argument(
        "-f",
        "--format",
        help="Output formats to use, comma separated (default=csv,tsv,json)",
        default="csv,tsv,json",
    )
    parser.add_argument(
        "-i",
        "--input",
        help="Input file to transform instead of stdin"
    )
    parser.add_argument(
        "-b",
        "--buckets",
        help="JSON collection of age buckets to determine case age ranges",
        required=True
    )
    args = parser.parse_args()
    transform(args.input, args.output, args.format.split(","), args.buckets)
