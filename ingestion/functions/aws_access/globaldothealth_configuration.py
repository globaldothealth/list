AWS_REGION = "us-east-1"
INGESTION_SOURCES_BUCKET = "epid-sources-raw"
DEFAULT_SCHEDULE_EXPRESSION = "rate(1 day)"
# Our file retention policy is twice the schedule period plus 10 days
GRACE_PERIOD_IN_DAYS = 10
