from datetime import datetime

from aws_access.EventBridgeClient import EventBridgeClient, ScheduleRule
import aws_access.globaldothealth_configuration as gdoth

def get_schedule_rules():
    """Find a list of the schedule rules related to ingestion in G.h"""
    event_bridge = EventBridgeClient(gdoth.AWS_REGION)
    return [ScheduleRule(r) for r in event_bridge.get_rule_descriptions()]

if __name__ == "__main__":
    print({r.ingestion_source_id(): r.oldest_file_age(datetime.today()) for r in get_schedule_rules() if r.is_ingestion_rule()})
