import os
import tarfile
import boto3


def all_files_processed(bucket, folder, full_path):
    number_of_parts = int((full_path.split("-of-")[1]).split(".")[0])
    
    s3 = boto3.resource('s3')
    bucket_obj = s3.Bucket(bucket)
    file_count = len([x for x in bucket_obj.objects.filter(Prefix=folder)])

    ready_to_combine = False

    if file_count == number_of_parts:
        ready_to_combine = True

    return ready_to_combine  

def get_files(bucket, folder):
    s3 = boto3.resource('s3')
    bucket_obj = s3.Bucket(bucket)
    all_keys [x.key for x in bucket_obj.objects.filter(Prefix=folder)]
    downloaded_files = []
    for k in all_keys:
        filename = "/mnt/efs/" + k.split("/")[-1]
        bucket_obj.download_file(k, filename)
        downloaded_files.append(filename)
    return downloaded_files


def combine_files(downloaded_files):
    combined_file = "mnt/efs/latestdata.csv"
    with open(combined_file, "wb") as fout:
        # first file:
        with open(downloaded_files[0], "rb") as f:
            fout.write(f.read())
        # now the rest:    
        for k in downloaded_files[1:]:
            with open(k, "rb") as f:
                next(f) # skip the header
                fout.write(f.read())
    return combined_file


def compress_file(output_file):
    compressed_file = "mnt/efs/latestdata.tar.gz"
    with tarfile.open(compressed_file, "w:gz") as tar:
        tar.add(output_file)
    return compressed_file


def upload_to_production():
    """
    Upload parsed .csv file to s3.
    """
    filename = "/".join(processed_file.split("/")[-2:])
    s3 = boto3.resource('s3')
    s3.Object("covid-19-data-export",
              f"processing/combine/{filename}").upload_file(processed_file)

def lambda_handler(event, context):
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = record['s3']['object']['key']
    folder =  os.path.split(key)[0]
    folder_path = os.path.join(bucket, folder)
    full_path = os.path.join(bucket, key)
    s3_url = "s3://" + folder_path

    if all_files_processed(bucket, folder, full_path):
        downloaded_files = get_files(bucket, folder)
        combined_file = combine_files(downloaded_files)
        compressed_file = compress_file(combined_file)
        upload_to_production(compressed_file)