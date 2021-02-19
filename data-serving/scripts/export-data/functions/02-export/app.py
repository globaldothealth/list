"""Exports MongoDB data to a csv or json file."""

import argparse
import datetime
import os
import subprocess

import boto3

username = os.environ.get("MONGO_USERNAME")
password = os.environ.get("MONGO_PASSWORD")
bucket = os.environ.get("EXPORT_BUCKET")

uri = f"mongodb+srv://{username}:{password}@covid19-map-cluster01.sc7u9.mongodb.net/covid19?retryWrites=true&w=majority"
s3 = boto3.client("s3")


def extract_event_fields(event: dict):
    return (
        event["skip"],
        event["limit"],
        event["num_cases"],
        event["num_chunk"],
        event["num_chunks"],
        event["field_names"],
    )


def export_chunk(skip, limit, num_cases, num_chunk, num_chunks, field_names):
    print(field_names)
    end_range = skip + limit - 1
    if end_range > num_cases:
        end_range = num_cases
    print(f"Exporting cases {skip} through {end_range}")
    z_num_chunk = str(num_chunk).zfill(4)
    z_num_chunks = str(num_chunks).zfill(4)
    chunk_fn = f"cases_{z_num_chunk}-of-{z_num_chunks}.csv"
    subprocess.run(
        [
            "./mongoexport",
            f'--uri="{uri}"',
            f'--collection="cases"',
            f'--fields="{field_names}"',
            f'--type="csv"',
            f'--out="/tmp/{chunk_fn}"',
            "--jsonArray",
            f"--skip={skip}",
            f"--limit={limit}"
        ]
    )
    return chunk_fn


def lambda_handler(event, context):
    print("Let's export some data")
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    skip, limit, num_cases, num_chunk, num_chunks, field_names = extract_event_fields(
        event
    )
    chunk = export_chunk(skip, limit, num_cases, num_chunk, num_chunks, field_names)
    s3_fn = f"processing/parse/{now}/{chunk}"
    response = s3.upload_file("/tmp/" + chunk, bucket, s3_fn)
    print(response)
    print(f"Uploaded chunk #{num_chunk} to {s3_fn}")
    print("Fin!")
