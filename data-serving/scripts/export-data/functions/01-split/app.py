"""Exports MongoDB data to a csv or json file."""

import os
import json

import boto3
import pymongo

username = os.environ.get("MONGO_USERNAME")
password = os.environ.get("MONGO_PASSWORD")
export_arn = os.environ.get("EXPORT_FUNCTION")


uri = f"mongodb+srv://{username}:{password}@covid19-map-cluster01.sc7u9.mongodb.net/covid19?retryWrites=true&w=majority"
client = pymongo.MongoClient(uri)
db = client.covid19
cases = db.cases

lambda_client = boto3.client("lambda", region_name="us-east-1")
s3 = boto3.client("s3")


def lambda_handler(event, context):
    """Global ingestion retrieval function.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict specified by the CloudWatch Event Rule.
        This must contain a `sourceId` field specifying the canonical epid
        system source UUID.
        For more information, see:
          https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type

    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    JSON object containing the bucket and key at which the retrieved data was
    uploaded to S3. For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    num_cases = cases.count_documents({})
    print(f"There are {num_cases} total cases.")
    with open("fields.txt", "r") as f:
        field_names = ",".join(f.read().split("\n"))
    limit = int(100000)
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
            "field_names": field_names
        }
        print(f"Invoking export #{num_chunk} of {num_chunks}")
        response = lambda_client.invoke(
            FunctionName=export_arn,
            InvocationType='Event',
            Payload=json.dumps(payload))
        print(f"Export response: {response}")
        skip += limit

    print("Fin!")
