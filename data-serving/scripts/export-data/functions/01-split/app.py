"""Exports MongoDB data to a csv or json file."""

import os
import json

import boto3
import pymongo

username = os.environ.get("MONGO_USERNAME")
password = os.environ.get("MONGO_PASSWORD")
export_arn = os.environ.get("EXPORT_FUNCTION")
limit = int(os.environ.get("CHUNK_SIZE"))


uri = f"mongodb+srv://{username}:{password}@covid19-map-cluster01.sc7u9.mongodb.net/covid19?retryWrites=true&w=majority"
client = pymongo.MongoClient(uri)
db = client.covid19
cases = db.cases

lambda_client = boto3.client("lambda", region_name="us-east-1")
s3 = boto3.client("s3")


def lambda_handler(event, context):
    """Determines number of chunks and invokes export function with appropriate indices.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict specified by EventBridge.
    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    """

    num_cases = cases.count_documents({'list': True})
    print(f"There are {num_cases} total cases.")
    exclude_sources = [str(s['_id']) for s in db.sources.find({"excludeFromLineList": True})]
    print(f"Excluding sources {exclude_sources}")
    with open("fields.txt", "r") as f:
        field_names = ",".join(f.read().split("\n"))
    num_chunks = num_cases // limit
    print(
        f"Using a size of {limit} cases, there are {num_chunks} chunks to export.")
    skip = 0
    for i in range(num_chunks):
        num_chunk = i + 1
        payload = {
            "skip": skip,
            "limit": limit,
            "num_cases": num_cases,
            "num_chunk": num_chunk,
            "num_chunks": num_chunks,
            "field_names": field_names,
            "exclude_sources": exclude_sources,
        }
        print(f"Invoking export #{num_chunk} of {num_chunks}")
        response = lambda_client.invoke(
            FunctionName=export_arn,
            InvocationType='Event',
            Payload=json.dumps(payload))
        print(f"Export response: {response}")
        skip += limit

    print("Fin!")
