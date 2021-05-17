import datetime
import json
import os
import tarfile
import tempfile
import contextlib
from pathlib import Path

import boto3


def all_files_processed(bucket, folder, full_path):
    """
    Check to see if all processed chunks are present in S3 Bucket.
    """
    number_of_parts = int((full_path.split("-of-")[1]).split("_")[0])

    s3 = boto3.resource("s3")
    bucket_obj = s3.Bucket(bucket)
    file_count = len([x for x in bucket_obj.objects.filter(Prefix=folder)])

    return file_count == number_of_parts


def get_files(bucket, folder, download_folder):
    """
    Retrieve all chunks from S3.
    """
    print("Retrieving files...")
    s3 = boto3.resource("s3")
    bucket_obj = s3.Bucket(bucket)
    all_keys = [x.key for x in bucket_obj.objects.filter(Prefix=folder)]
    downloaded_files = []
    for k in all_keys:
        filename = os.path.join(download_folder, k.split("/")[-1])
        s3.Object(bucket, k).download_file(filename)
        downloaded_files.append(filename)
    print("Files retrieved!")
    print(downloaded_files)
    return downloaded_files


def combine(downloaded_files):
    """
    Combine compressed data, data dictionary, and acknowledgements to tar file
    """
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    _, tarred_file = tempfile.mkstemp(dir="/mnt/efs")
    with tarfile.open(tarred_file, "w") as tar:
        for d in downloaded_files:
            tar.add(d, f"{Path(d).stem.replace('processed.csv', '')}{now}.csv.gz")
        tar.add('data_dictionary.csv', 'data_dictionary.csv')
        tar.add('citation_data.rtf', 'citation_data.rtf')

    return tarred_file


def upload_to_production(compressed_file):
    """
    Upload tar.gz file to s3.
    """
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    s3 = boto3.resource("s3")
    s3.Object("covid-19-data-export",
              "latest/latestdata.tar").upload_file(compressed_file)
    s3.Object("covid-19-data-export", f"archive/{now}.tar").upload_file(
        compressed_file
    )
    # Attempt cleanup of compressed file
    with contextlib.suppress(FileNotFoundError):
        os.remove(compressed_file)


def lambda_handler(event, context):
    """
    1. Checks if all chunks have been processed
    2. Downloads all chunks to EFS
    3. Combines all chunks
    4. Adds combined file to tar.gz with data dictionary and acknowledgements
    5. Uploads to S3

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict specified by S3.
    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    """
    if type(event) == str:
        event = json.loads(event)
    print("Received event:", event)
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    key = record["s3"]["object"]["key"]
    folder = os.path.split(key)[0]
    full_path = os.path.join(bucket, key)

    if all_files_processed(bucket, folder, full_path):
        print("All chunks parsed! Starting merge...")
        with tempfile.TemporaryDirectory(dir="/mnt/efs") as download_folder:
            downloaded_files = get_files(bucket, folder, download_folder)
            print("Creating tarball...")
            tarball = combine(downloaded_files)
            print("Uploading to S3 bucket...")
            upload_to_production(tarball)
