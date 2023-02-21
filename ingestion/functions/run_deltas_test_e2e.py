import os
import boto3
import datetime
import time
import requests
import json
from retrieval import retrieval
from common import common_lib

# Ensure DOCKERIZED is set as an environment variable before running this code in a TEST environment
#        ==========

source_id = None        # Specify to update; None to create new source

tempdir = '/tmp'
s3_bucket = 'gdh-sources'
source_name = 'diff_test'
local_email = 'test@email.com'
env = 'local'
url = 'http://localhost:3001/api/sources'

file_list = [
    f'parsing/{source_name}/file1_initial.csv',  # Initial upload
    f'parsing/{source_name}/file2_add4.csv',  # Incremented upload (use 'diff')
    f'parsing/{source_name}/file3_rem3.csv',  # Repeat (no change)
]

s3_client = boto3.client('s3',
    endpoint_url=os.environ.get('AWS_ENDPOINT', 'https://localhost.localstack.cloud:4566'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', 'test'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', 'test'),
    region_name=os.environ.get('AWS_REGION', 'eu-central-1'))

source = {
    'name': source_name,
    'countryCodes': [],
    'origin': {
        'url': f's3://{s3_bucket}/{source_name}.csv',
        'license': 'None',
        'providerName': source_name,
        'providerWebsiteUrl': 'test'
    },
    'format': 'CSV',
    'automation': {
        'parser': {'awsLambdaArn': 'diff_test-diff_test-ingestor-dev'},
        'schedule': {'awsScheduleExpression': 'rate(1 day)'},
    },
    'notificationRecipients': [
        f'{local_email}'
    ],
    'excludeFromLineList': False,
    'hasStableIdentifiers': False
}

# create new source
cookies = common_lib.login(local_email)
message_header = {'Content-Type': 'application/json'}
if source_id:
    # Update existing source
    r = requests.put(f"{url}/{source_id}", data=json.dumps(source),
                     headers=message_header, cookies=cookies)
else:
    # Create new source
    r = requests.post(url, data=json.dumps(source),
                      headers=message_header, cookies=cookies)
    source_id = json.loads(r.content.decode('utf-8'))['_id']

# retrieval reads from environment variables
os.environ['EPID_INGESTION_ENV'] = env
os.environ['EPID_INGESTION_SOURCE_ID'] = source_id
os.environ['EPID_INGESTION_PARSING_DATE_RANGE'] = ''
os.environ['EPID_INGESTION_EMAIL'] = local_email

# Retrieve and parse an updating file to test diff functionality
for filename in file_list:
    s3_client.upload_file(
        filename,
        s3_bucket,
        f'{source_name}.csv')
    retrieval.run_retrieval(tempdir=tempdir)
    # Wait until the next minute to ensure separate upload directories
    if filename != file_list[-1]:
        initial_time = datetime.datetime.now()
        while (datetime.datetime.now().minute == initial_time.minute):
            print('waiting for unique timestamp to proceed '
                  f'({60 - datetime.datetime.now().second} secs)...', end='\r')
            time.sleep(0.25)
