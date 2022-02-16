from datetime import datetime
import logging
import os

from aws_access.EventBridgeClient import EventBridgeClient, ScheduleRule
from aws_access.S3Client import S3Client
import aws_access.globaldothealth_configuration as gdoth

logger = logging.getLogger("clean_old_ingestion_source_files")

def get_schedule_rules(endpoint_url=None):
    """Find a list of the schedule rules related to ingestion in G.h"""
    event_bridge = EventBridgeClient(gdoth.AWS_REGION, endpoint_url)
    return event_bridge.get_schedule_rules()

def main(endpoint_url=None):
    logger.info("Let's do this!")
    sources_and_ages = {r.ingestion_source_id(): r.oldest_file_age(datetime.today()) for r in get_schedule_rules(endpoint_url) if r.is_ingestion_rule()}
    s3 = S3Client(gdoth.AWS_REGION, endpoint_url)
    for source_id, oldest_age in sources_and_ages.items():
        logger.info(f"Working on {source_id}")
        earliest_date = datetime.now() + oldest_age
        logger.info(f"Threshold date is {earliest_date}")
        for file in s3.objects_in_bucket_for_ingestion_source(gdoth.INGESTION_SOURCES_BUCKET, source_id):
            file_name = file.key
            # expected convention: source_id/year/month/day/hhmm/filename.ext
            components = file_name.split('/')
            if len(components) != 6:
                logger.warning(f"file name {file_name} does not meet expectations, skipping")
                continue
            _, their_year, their_month, their_day, _, _ = components
            their_date = datetime(int(their_year), int(their_month), int(their_day))
            if their_date < earliest_date:
                logger.info(f"deleting {file_name}")
                s3.delete_object_in_bucket(gdoth.INGESTION_SOURCES_BUCKET, file_name)
            else:
                logger.info(f"keeping {file_name}")
    logger.info("done!")


if __name__ == "__main__":
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
    main(endpoint_url)