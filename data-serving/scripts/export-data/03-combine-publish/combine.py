import os 
import time
import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.environ['region']
projectId = os.environ['projectId']
importRoleArn = os.environ['importRoleArn']

def lambda_handler(event, context):
    print("Received event: " + str(event))
    for record in event['Records']:
        # Assign some variables to make it easier to work with the data in the 
        # event recordi
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        folder =  os.path.split(key)[0]
        folder_path = os.path.join(bucket, folder)
        full_path = os.path.join(bucket, key)
        s3_url = "s3://" + folder_path
        
        # Check to see if all file parts have been processed.
        if all_files_processed(bucket, folder, full_path):
            # If you haven't recently run an import job that uses a file stored in 
            # the specified S3 bucket, then create a new import job. This prevents
            # the creation of duplicate segments.
            if not (check_import_jobs(bucket, folder, s3_url)):
                create_import_job(s3_url)
            else: 
                print("Import job found with URL s3://" 
                        + os.path.join(bucket,folder) + ". Aborting.")
        else:
            print("Parts haven't finished processing yet.")

# Determine if all of the file parts have been processed.
def all_files_processed(bucket, folder, full_path):
    # Use the "__ofN" part of the file name to determine how many files there 
    # should be.
    number_of_parts = int((full_path.split("__of")[1]).split("_processed")[0])
    
    # Figure out how many keys contain the prefix for the current batch of 
    # folders (basically, how many files are in the appropriate "folder").
    client = boto3.client('s3')
    objs = client.list_objects_v2(Bucket=bucket,Prefix=folder)
    file_count = objs['KeyCount']

    ready_for_import = False
    
    if file_count == number_of_parts:
        ready_for_import = True
    
    return ready_for_import    

# Check Amazon Pinpoint to see if any import jobs have been created by using 
# the same S3 folder. 
def check_import_jobs(bucket, folder, s3_url):
    url_list = []
    
    # Retrieve a list of import jobs for the current project ID.
    client = boto3.client('pinpoint')
    try:
        client_response = client.get_import_jobs(
            ApplicationId=projectId
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        segment_response = client_response['ImportJobsResponse']['Item']
        # Parse responses. Add all S3Url values to a list.
        for item in segment_response:
            s3_url_existing = item['Definition']['S3Url']
            url_list.append(s3_url_existing)
    
    # Search for the current S3 URL in the list.
    if s3_url in url_list:
        found = True
    else:
        found = False
    
    return found

# Create the import job in Amazon Pinpoint.
def create_import_job(s3_url):
    client = boto3.client('pinpoint')
    
    segment_name = s3_url.split('/')[4]

    try:
        response = client.create_import_job(
            ApplicationId=projectId,
            ImportJobRequest={
                'DefineSegment': True,
                'Format': 'CSV',
                'RegisterEndpoints': True,
                'RoleArn': importRoleArn,
                'S3Url': s3_url,
                'SegmentName': segment_name
            }
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Import job " + response['ImportJobResponse']['Id'] + " " 
                + response['ImportJobResponse']['JobStatus'] + ".")
                
        print("Segment ID: " 
                + response['ImportJobResponse']['Definition']['SegmentId'])
        
        print("Application ID: " + projectId)