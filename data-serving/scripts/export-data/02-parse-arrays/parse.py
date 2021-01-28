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
    "transmission.routes"
]


def deep_get(dictionary, keys, default=None):
    """
    Retrieve values from nested dictionaries
    """
    return reduce(lambda d, key: d.get(key, default) if isinstance(d, dict) else default, keys.split("."), dictionary)


def convert_event(event):
    """
    Process individual events in the events array.

    Returns an unnested dictionary.
    """
    suffix = event['name']
    col_name = f"events.{suffix}"

    return ({
        f"{col_name}.value": event.get("value"),
        f"{col_name}.date.start": deep_get(event, "dateRange.start.$date"),
        f"{col_name}.date.end": deep_get(event, "dateRange.end.$date")
    })


def convert_string_list(item):
    """
    Converts text list into comma-separated string.
    """
    if (type(item) != str) or (item == '') or (item == '[]'):
        return None
    if type(json.loads(item)) == list:
        return ", ".join(json.loads(item))
    else:
        return item


def get_fields(infile):
    """
    Add processed event fieldnames to fields.
    """
    with open(infile, 'r') as f:
        reader = csv.DictReader(f)
        row = next(reader)
        headers = set(row.keys())
    cols_to_add = []
    for col_name in ["confirmed", "firstClinicalConsultation", "hospitalAdmission", "icuAdmission", "onsetSymptoms", "outcome", "selfIsolation"]:
        cols_to_add.append(f"events.{col_name}.value")
        cols_to_add.append(f"events.{col_name}.date.start")
        cols_to_add.append(f"events.{col_name}.date.end")

    fields = headers.union(set(cols_to_add))
    fields = sorted(list(fields - set(['events'])))
    return fields


def process_chunk(infile, outfile=None):
    """
    Processes single .csv chunk.
    """
    fields = get_fields(infile)
    if not outfile:
        outfile = infile[:-4] + "_processed.csv"
    with open(outfile, 'w+') as g:
        with open(infile, 'r') as f:
            reader = csv.DictReader(f)
            writer = csv.DictWriter(
                g, fieldnames=fields, extrasaction='ignore')
            writer.writeheader()
            for row in reader:
                if "ObjectId" not in row['_id']:
                    continue
                if type(row['notes']) == str:
                    row['notes'] = row['notes'].replace('\n', ', ')
                for arr_field in __ARRAYS:
                    if row[arr_field]:
                        row[arr_field] = convert_string_list(row[arr_field])
                if row['events']:
                    for event in json.loads(row['events']):
                        row = row | convert_event(event)
                writer.writerow(row)
    print(outfile)
    return(outfile)


def get_chunk(event):
    """
    Retrieves single chunk and stores in /tmp/
    """
    s3 = boto3.resource('s3')
    src_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    src_key = event["Records"][0]["s3"]["object"]["key"]
    target = f"/tmp/{src_key}"
    os.makedirs("/".join(target.split("/")[:-1]), exist_ok=True)

    s3.Object(src_bucket, src_key).download_file(target)
    return target


def upload_processed_chunk(processed_file):
    """
    Upload parsed .csv file to s3.
    """
    filename = "/".join(processed_file.split("/")[-2:])
    s3 = boto3.resource('s3')
    s3.Object("covid-19-data-export",
              f"processing/combine/{filename}").upload_file(processed_file)


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


if __name__ == "__main__":
    event = {
        "Records": [
            {"s3": {
                "bucket": {"name": "covid-19-data-export"},
                "object": {"key": "processing/combine/2021-01-27/cases_1-of-51.csv"}
            }}
        ]
    }
    lambda_handler(event, "zzz")
