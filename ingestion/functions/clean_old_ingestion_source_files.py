from aws_access.EventBridgeClient import EventBridgeClient
import aws_access.globaldothealth_configuration as gdoth
import re


class ScheduleRule:
    def __init__(self, rule_description: dict):
        self.rule_description = rule_description
    
    def schedule(self):
        return self.rule_description.get("ScheduleExpression")
    
    def is_ingestion_rule(self):
        return self.description().startswith("Scheduled Batch ingestion rule")
    
    def description(self):
        return self.rule_description.get("Description", "")

    def ingestion_source_id(self):
        assert self.is_ingestion_rule()
        return re.search("[a-z0-9]{24}", self.description()).group(0)

def get_schedule_rules():
    """Find a list of the schedule rules related to ingestion in G.h"""
    event_bridge = EventBridgeClient(gdoth.AWS_REGION)
    return [ScheduleRule(r) for r in event_bridge.get_rule_descriptions()]

if __name__ == "__main__":
    print({r.ingestion_source_id(): r.schedule() for r in get_schedule_rules() if r.is_ingestion_rule()})
