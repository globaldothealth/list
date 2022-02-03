import boto3
from uuid import uuid4


"""
Discover AWS EventBridge rules
"""
class EventBridgeClient:
    def __init__(self, region: str):
        self.aws_client = boto3.client("events", region)

    def get_rule_descriptions(self):
        return self.aws_client.list_rules().get("Rules")

    def get_rule_targets(self, rule_name: str):
        batch_targets = {}
        targets = self.aws_client.list_targets_by_rule(Rule=rule_name)
        for target in targets.get("Targets"):
            target_id = target.get("Id")
            if not target_id:
                raise KeyError(f"Could not get target ID for {rule_name}")
            batch_targets[target_id] = target.get("BatchParameters")
        return batch_targets

    def enable_schedule(self, rule_name: str):
        self.aws_client.enable_rule(Rule=rule_name)

    def disable_schedule(self, rule_name: str):
        self.aws_client.disable_rule(Rule=rule_name)

    def add_schedule(self, rule_name: str, description: str, is_enabled: bool):
        state = "ENABLED" if is_enabled else "DISABLED"
        self.aws_client.put_rule(
                Name=rule_name,
                ScheduleExpression=DEFAULT_SCHEDULE_EXPRESSION,
                State=state,
                Description=description
            )

    def remove_schedule(self, rule_name: str):
        self.event_bridge_client.delete_rule(rule_name)

    def add_target_to_rule(self, rule_name: str, target_name: str, job_name: str, job_queue: str, role: str):
        target_id = str(uuid4())
        target = [{
            "Id": target_id,
            "Arn": job_queue,
            "RoleArn": role,
            "BatchParameters": {
                "JobDefinition": target_name,
                "JobName": job_name
            }
        }]
        self.aws_client.put_targets(Rule=rule_name, Targets=target)

    def remove_targets_from_rule(self, rule_name: str):
        target_ids = list(self.get_rule_targets(rule_name).keys())
        self.aws_client.remove_targets(Rule=args.rule_name, Ids=target_ids)
