"""Exports MongoDB data to a csv or json file."""

import datetime
import boto3
import pymongo
import argparse
import subprocess
import json
import os

username = os.environ.get('MONGO_USERNAME')
password = os.environ.get('MONGO_PASSWORD')
uri = f"mongodb+srv://{username}:{password}@covid19-map-cluster01.sc7u9.mongodb.net/covid19?retryWrites=true&w=majority"
client = pymongo.MongoClient(uri)
db = client.covid19
cases = db.cases

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

if __name__ == "__main__":

    num_cases = cases.count_documents({})
    print(f'There are {num_cases} total cases.')
    args = parser.parse_args()

    limit=int(args.chunksize)
    num_chunks = num_cases % limit
    print(f"Using a size of {limit} cases, there are {num_chunks} chunks to export.")
    skip=0
    for i in range(num_cases % limit):
        chunk_num = i + 1
        end_range = skip + limit - 1
        if end_range > num_cases:
            end_range = num_cases
        print(f'Exporting cases {skip} through {end_range}')
        out_chunk = f"{args.collection}_{chunk_num}-of-{num_chunks}.{args.format}"
        subprocess.run([
            "mongoexport",
            f'--uri="{args.mongodb_connection_string}"',
            f'--collection="{args.collection}"',
            f'--fields="{args.fields}"',
            f'--type="{args.format}"',
            f'--out="{out_chunk}"',
            '--jsonArray',
            f'--skip={skip}',
            f'--limit={limit}'
        ])
        skip += limit

    print("Fin!")
