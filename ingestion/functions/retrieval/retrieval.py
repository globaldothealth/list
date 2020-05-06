import boto3
import requests
from datetime import datetime, timezone


SOURCE_ID_FIELD = "sourceId"
OUTPUT_BUCKET = "epid-raw-sources"
TIME_FILEPART_FORMAT = "/%Y/%m/%d/%H%M/"

s3_client = boto3.client("s3")


def extract_source_id(event):
    if SOURCE_ID_FIELD not in event:
        error_message = (
            "Required field {:s} not found in input event json.".format(
                SOURCE_ID_FIELD))
        print(error_message)
        raise ValueError(error_message)
    return event[SOURCE_ID_FIELD]


def retrieve_content(source_id):
    try:
        ip = requests.get("http://checkip.amazonaws.com/").text.strip()
        key_filename_part = "ip.txt"
        file = open("/tmp/{:s}".format(key_filename_part), "w")
        file.write(ip)
        file.close()
        s3_object_key = "{:s}{:s}{:s}".format(
            source_id,
            datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT),
            key_filename_part)
        return (file.name, s3_object_key)
    except requests.RequestException as e:
        print(e)
        raise e


def upload_to_s3(file_name, s3_object_key):
    try:
        s3_client.upload_file(
            file_name, OUTPUT_BUCKET, s3_object_key)
        print("Uploaded source content to bucket {:s} with key {:s}".format(
            OUTPUT_BUCKET, s3_object_key))
    except Exception as e:
        print(e)
        raise e


def lambda_handler(event, context):
    """Global ingestion retrieval function.

    Will be used to scrape source content and persist it to S3.
    For now, extracts the source ID from the input event JSON, and persists the
    executing machine IP in a (canonically keyed) dummy file in S3.

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

    source_id = extract_source_id(event)
    file_name, s3_object_key = retrieve_content(source_id)
    upload_to_s3(file_name, s3_object_key)
    return {"bucket": OUTPUT_BUCKET, "key": s3_object_key}
