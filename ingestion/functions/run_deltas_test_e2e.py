import os
import boto3
import requests
import json
import dateutil
from retrieval import retrieval
from common import common_lib
from unittest import mock

# Ensure DOCKERIZED is set as an environment variable before running this code in a TEST environment
#        ==========
# Start the full_stack, login, make_superuser and set LOCAL_EMAIL (or edit below)

source_id = None        # Specify to add to existing; None to create new

tempdir = os.environ.get('TEMPDIR', '/tmp')
s3_bucket = os.environ.get('S3_BUCKET', 'gdh-sources')
source_name = os.environ.get('SOURCE_NAME', 'diff_test')
local_email = os.environ.get('LOCAL_EMAIL', 'test@email.com')
env = os.environ.get('ENV', 'local')
url = os.environ.get('URL', 'http://localhost:3001/api/sources')

file_list = [
    # Initial upload
    (f'parsing/{source_name}/file1_initial.csv', '2022-01-01 12:00:00'),
    # Add rows
    (f'parsing/{source_name}/file2_add4.csv', '2022-07-07 12:34:56'),
    # Delete rows
    (f'parsing/{source_name}/file3_rem3.csv', '2023-02-02 15:22:22'),
]

s3_client = boto3.client(
    's3',
    endpoint_url=os.environ.get('AWS_ENDPOINT', 'https://localhost.localstack.cloud:4566'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', 'test'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', 'test'),
    region_name=os.environ.get('AWS_REGION', 'eu-central-1'),
)

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
        'parser': {'awsLambdaArn': f'{source_name}-{source_name}-ingestor-dev'},
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

lastmocktime = file_list[0][1]
for filename, mocktime in file_list:
    with mock.patch('retrieval.retrieval.parse_datetime_current',
                    return_value=dateutil.parser.parse(mocktime)), \
         mock.patch('retrieval.retrieval.parse_datetime_lastgoodingestion',
                    return_value=dateutil.parser.parse(lastmocktime)):
        s3_client.upload_file(
            filename,
            s3_bucket,
            f'{source_name}.csv')
        retrieval.run_retrieval(tempdir=tempdir)
        lastmocktime = mocktime
