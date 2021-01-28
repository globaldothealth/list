"""Exports MongoDB data to a csv or json file."""

import argparse
import datetime
import os
import subprocess

import boto3
import pymongo

username = os.environ.get('MONGO_USERNAME')
password = os.environ.get('MONGO_PASSWORD')

uri = f"mongodb+srv://{username}:{password}@covid19-map-cluster01.sc7u9.mongodb.net/covid19?retryWrites=true&w=majority"
client = pymongo.MongoClient(uri)
db = client.covid19
cases = db.cases

s3 = boto3.client('s3')

parser = argparse.ArgumentParser(
    description='Exports MongoDB data to a csv or json file')
parser.add_argument("--mongodb_connection_string",
                    default=uri)
parser.add_argument("--collection", default="cases")
parser.add_argument(
    "--fields", type=argparse.FileType('r'),
    default="fields.txt",
    help="txt file containing the case fields to export")
parser.add_argument("--format", "-f", choices=["csv", "json"], default="csv")
parser.add_argument("--chunksize", default="100000")


def export_chunk(skip, limit, num_cases, num_chunk, field_names):
    end_range = skip + limit - 1
    if end_range > num_cases:
        end_range = num_cases
    print(f'Exporting cases {skip} through {end_range}')
    chunk_fn = f"{args.collection}_{num_chunk}-of-{num_chunks}.{args.format}"
    subprocess.run([
        "mongoexport",
        f'--uri="{args.mongodb_connection_string}"',
        f'--collection="{args.collection}"',
        f'--fields="{field_names}"',
        f'--type="{args.format}"',
        f'--out="{chunk_fn}"',
        '--jsonArray',
        f'--skip={skip}',
        f'--limit={limit}'
    ])
    return chunk_fn


if __name__ == "__main__":
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    num_cases = cases.count_documents({})
    print(f'There are {num_cases} total cases.')
    args = parser.parse_args()
    with open('fields.txt', 'r') as f:
        field_names = ",".join(f.read().split("\n"))
    limit = int(args.chunksize)
    num_chunks = num_cases // limit
    print(
        f"Using a size of {limit} cases, there are {num_chunks} chunks to export.")
    skip = 0
    for i in range(num_cases % limit):
        num_chunk = i + 1
        chunk = export_chunk(skip, limit, num_cases, num_chunk, field_names)
        s3_fn = f'processing/combine/{now}/{chunk}'
        response = s3.upload_file(
            chunk, 'covid-19-data-export', s3_fn)
        print(f"Uploaded chunk #{num_chunk} to {s3_fn}")
        os.remove(chunk)
        skip += limit

    print("Fin!")
