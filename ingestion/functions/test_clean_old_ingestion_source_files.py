import boto3
import unittest
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

import clean_old_ingestion_source_files
import aws_access.globaldothealth_configuration as gdoth

localstack = 'http://localhost:4566'
rate_event_id = '5f7796ece78c6866f6f676e0'
file_content = "blah blah blah" # this is unimportant
file_time = '1130' # also unimportant
file_name = 'slartibartfast.json' # "my name is not important"

def s3_object_key_helper(source_id, date, file_name):
    return f"{source_id}/{date.year}/{date.month}/{date.day}/{file_time}/{file_name}"


class CleanupScriptTests(unittest.TestCase):
    def setUp(self):
        # create eventbridge rule for an ingestion source
        self.eventbridge = boto3.client("events", endpoint_url=localstack)
        self.eventbridge.put_rule(
            Name='Test ingestion rule',
            ScheduleExpression='rate(7 days)',
            State='ENABLED',
            Description=f'Scheduled Batch ingestion rule for source: Taiwan with ID: '
                        f'{rate_event_id} for environment: prod'
        )
        # create ingestion data bucket
        self.s3 = boto3.resource("s3", endpoint_url=localstack)
        self.s3.create_bucket(Bucket=gdoth.INGESTION_SOURCES_BUCKET, CreateBucketConfiguration={
            'LocationConstraint': gdoth.AWS_REGION
        })
        # create various "source files" in the ingestion data bucket
        # one from today (we will do this all relative to today's date rather than pin the date,
        # if this causes a problem later please hunt me down)
        now = datetime.now()
        self.today_key = s3_object_key_helper(rate_event_id, now, file_name)
        self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.today_key).put(Body=file_content)
        # one from the day before the age-out date of the schedule rule
        day_before = now + timedelta(days=-25)
        self.day_before_key = s3_object_key_helper(rate_event_id, day_before, file_name)
        self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.day_before_key).put(Body=file_content)
        # one from the day of the age-out date
        day_of = now + timedelta(days=-24)
        self.day_of_key = s3_object_key_helper(rate_event_id, day_of, file_name)
        self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.day_of_key).put(Body=file_content)
        # one from the day after the age-out date
        day_after = now + timedelta(days=-23)
        self.day_after_key = s3_object_key_helper(rate_event_id, day_after, file_name)
        self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.day_after_key).put(Body=file_content)

    def tearDown(self):
        # destroy eventbridge rules
        self.eventbridge.delete_rule(Name='Test ingestion rule')
        # delete ingestion bucket
        # first delete objects that test didn't delete
        bucket = self.s3.Bucket(gdoth.INGESTION_SOURCES_BUCKET)
        bucket.objects.all().delete()
        bucket.delete()

    def testCleanupScript(self):
        clean_old_ingestion_source_files.main(localstack)
        assert self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.today_key).delete_marker is not True
        assert self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.day_after_key).delete_marker is not True
        with self.assertRaises(ClientError):
            assert self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.day_before_key).load()
        with self.assertRaises(ClientError):
            assert self.s3.Object(gdoth.INGESTION_SOURCES_BUCKET, self.day_of_key).load()

if __name__ == '__main__':
    unittest.main()