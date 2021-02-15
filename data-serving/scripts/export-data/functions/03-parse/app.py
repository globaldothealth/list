import csv
import json
import os
from functools import reduce

import boto3

__ARRAYS = [
    "caseReference.uploadIds",
    "demographics.nationalities",
    "symptoms.values",
    "preexistingConditions.values",
    "transmission.linkedCaseIds",
    "transmission.places",
    "transmission.routes",
    "genomeSequences",
    "pathogens"
]

__OMIT = [
    "location.query",
    "revisionMetadata.creationMetadata.curator",
    "revisionMetadata.editMetadata.curator",
    "events"
]

bucket = os.environ.get("EXPORT_BUCKET")

def deep_get(dictionary, keys, default=None):
    """
    Retrieve values from nested dictionaries
    """
    return reduce(
        lambda d, key: d.get(key, default) if isinstance(d, dict) else default,
        keys.split("."),
        dictionary,
    )


def convert_date(date_string):
    if date_string:
        return date_string[:10]


def convert_event(event):
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


def convert_addl_sources(sources_string):
    if sources_string == "[]":
        return None
    sources_array = json.loads(sources_string)
    source_urls = [x["sourceUrl"] for x in sources_array]
    return ", ".join(source_urls)


def convert_string_list(item):
    """
    Converts text list into comma-separated string.
    """
    try:
        if (type(item) != str) or (item == "") or (item == "[]"):
            return None
        if type(json.loads(item)) == list:
            return ", ".join([str(x) for x in json.loads(item)])
        else:
            return item
    except Exception as e:
        print("Couldn't convert list.")
        print(e)
        print(item)
        return item


def get_fields(infile):
    """
    Add processed event fieldnames to fields.
    """
    with open(infile, "r") as f:
        reader = csv.DictReader(f)
        row = next(reader)
        headers = set(row.keys())
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
        cols_to_add.append(f"events.{col_name}.value")
        cols_to_add.append(f"events.{col_name}.date")

    fields = headers.union(set(cols_to_add))
    fields = sorted(list(fields - set(__OMIT)))
    return fields


def process_chunk(infile, outfile=None):
    """
    Processes single .csv chunk.
    """
    fields = get_fields(infile)
    if not outfile:
        outfile = "/tmp/out/" + infile[8:-4] + "_processed.csv"
    os.makedirs("/".join(outfile.split("/")[:-1]), exist_ok=True)
    with open(outfile, "w+") as g:
        with open(infile, "r") as f:
            reader = csv.DictReader(f)
            writer = csv.DictWriter(
                g, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            for row in reader:
                if "ObjectId" not in row["_id"]:
                    continue
                if type(row["notes"]) == str:
                    row["notes"] = row["notes"].replace("\n", ", ")
                for arr_field in __ARRAYS:
                    if row[arr_field]:
                        row[arr_field] = convert_string_list(row[arr_field])
                if row["caseReference.additionalSources"]:
                    row["caseReference.additionalSources"] = convert_addl_sources(
                        row["caseReference.additionalSources"])
                if row["events"]:
                    for e in json.loads(row["events"]):
                        converted = convert_event(e)
                        row = {**row, **converted}
                writer.writerow(row)
    print(outfile)
    return outfile


def get_chunk(event):
    """
    Retrieves single chunk and stores in /tmp/
    """
    s3 = boto3.resource("s3")
    src_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    src_key = event["Records"][0]["s3"]["object"]["key"]
    target = f"/tmp/in/{src_key}"
    os.makedirs("/".join(target.split("/")[:-1]), exist_ok=True)

    s3.Object(src_bucket, src_key).download_file(target)
    return target


def upload_processed_chunk(processed_file):
    """
    Upload parsed .csv file to s3.
    """
    filename = "/".join(processed_file.split("/")[-2:])
    s3 = boto3.resource("s3")
    s3.Object(bucket, f"processing/combine/{filename}").upload_file(
        processed_file
    )


def lambda_handler(event, context):
    """
    1. Downloads chunk.
    2. Parses chunk.
    3. Uploads chunk to s3.
    """
    print("Downloading chunk...")
    chunk = get_chunk(event)
    print("Chunk retrieved!")
    print("Parsing chunk...")
    processed_chunk = process_chunk(chunk)
    print("Chunk parsed!")
    print("Uploading chunk...")
    upload_processed_chunk(processed_chunk)
    print("Chunk uploaded!")
    print("Job complete.")
