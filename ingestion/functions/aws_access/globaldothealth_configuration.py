import os

AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")
INGESTION_SOURCES_BUCKET = os.environ.get("INGESTION_SOURCES_BUCKET", "gdh-sources")
DEFAULT_SCHEDULE_EXPRESSION = os.environ.get("DEFAULT_SCHEDULE_EXPRESSION", "rate(1 day)")
# Our file retention policy is twice the schedule period plus 10 days
GRACE_PERIOD_IN_DAYS = int(os.environ.get("GRACE_PERIOD_IN_DAYS", "10"))
