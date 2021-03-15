import datetime
import json
import os
import tarfile
import shutil

import boto3

def all_files_processed(bucket, folder, full_path):
    """
    Check to see if all processed chunks are present in S3 Bucket.
    """
    number_of_parts = int((full_path.split("-of-")[1]).split("_")[0])

    s3 = boto3.resource("s3")
    bucket_obj = s3.Bucket(bucket)
    file_count = len([x for x in bucket_obj.objects.filter(Prefix=folder)])

    ready_to_combine = False
    if file_count == number_of_parts:
        ready_to_combine = True

    return ready_to_combine

def setup_directories():
    """
    Make sure directories exist on EFS.
    """
    print("Creating directories...")
    os.makedirs("/mnt/efs/in/")
    os.makedirs("/mnt/efs/out/")
    print("Directories created.")


def get_files(bucket, folder):
    """
    Retrieve all chunks from S3.
    """
    print("Retrieving files...")
    s3 = boto3.resource("s3")
    bucket_obj = s3.Bucket(bucket)
    all_keys = [x.key for x in bucket_obj.objects.filter(Prefix=folder)]
    downloaded_files = []
    for k in all_keys:
        filename = "/mnt/efs/in/" + k.split("/")[-1]
        s3.Object(bucket, k).download_file(filename)
        downloaded_files.append(filename)
    print("Files retrieved!")
    return downloaded_files


def combine_files(downloaded_files):
    combined_file = "/mnt/efs/out/latestdata.csv"
    with open(combined_file, "wb") as fout:
        # first file:
        with open(downloaded_files[0], "rb") as f:
            fout.write(f.read())
        # now the rest:
        for k in downloaded_files[1:]:
            with open(k, "rb") as f:
                next(f)  # skip the header
                fout.write(f.read())
    return combined_file


def compress_file(input_file):
    """
    Add combined file, data dictionary, and acknowledgements to tar.gz.
    """
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    compressed_file = "/mnt/efs/latestdata.tar.gz"
    with tarfile.open(compressed_file, "w:gz") as tar:
        tar.add(input_file, f"globaldothealth_{now}.csv")
        tar.add('data_dictionary.csv', 'data_dictionary.csv')
        tar.add('citation_data.rtf', 'citation_data.rtf')
    return compressed_file


def upload_to_production(compressed_file):
    """
    Upload tar.gz file to s3.
    """
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    filename = compressed_file.split("/")[-1]
    s3 = boto3.resource("s3")
    s3.Object("covid-19-data-export",
              f"latest/{filename}").upload_file(compressed_file)
    s3.Object("covid-19-data-export", f"archive/{now}.tar.gz").upload_file(
        compressed_file
    )

def cleanup_directories():
    """
    Remove processing directories from EFS.
    """
    print("Cleaning up...")
    shutil.rmtree("/mnt/efs/out/")
    shutil.rmtree("/mnt/efs/in/")
    print("Temporary directories and files removed.")


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
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    key = record["s3"]["object"]["key"]
    folder = os.path.split(key)[0]
    full_path = os.path.join(bucket, key)

    if all_files_processed(bucket, folder, full_path):
        print("All chunks parsed! Starting merge...")
        setup_directories()
        downloaded_files = get_files(bucket, folder)
        combined_file = combine_files(downloaded_files)
        compressed_file = compress_file(combined_file)
        upload_to_production(compressed_file)
        cleanup_directories()
