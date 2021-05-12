import datetime
import json
import os
import tarfile
import tempfile
import contextlib

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
    return downloaded_files


def combine_and_compress(downloaded_files):
    """
    Combine and compress data, data dictionary, and acknowledgements to tar.gz.
    """
    with tempfile.NamedTemporaryFile(dir="/mnt/efs", delete=False) as fout:
        # first file:
        with open(downloaded_files[0], "rb") as f:
            fout.write(f.read())
        # now the rest:
        for k in downloaded_files[1:]:
            with open(k, "rb") as f:
                next(f)  # skip the header
                fout.write(f.read())
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    _, compressed_file = tempfile.mkstemp(dir="/mnt/efs")
    with tarfile.open(compressed_file, "w:gz") as tar:
        tar.add(fout.name, f"globaldothealth_{now}.csv")
        tar.add('data_dictionary.csv', 'data_dictionary.csv')
        tar.add('citation_data.rtf', 'citation_data.rtf')
    # Attempt cleanup of uncompressed file
    with contextlib.suppress(FileNotFoundError):
        os.remove(fout.name)

    return compressed_file


def upload_to_production(compressed_file):
    """
    Upload tar.gz file to s3.
    """
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    s3 = boto3.resource("s3")
    s3.Object("covid-19-data-export",
              "latest/latestdata.tar.gz").upload_file(compressed_file)
    s3.Object("covid-19-data-export", f"archive/{now}.tar.gz").upload_file(
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
            compressed_file = combine_and_compress(downloaded_files)
            upload_to_production(compressed_file)
