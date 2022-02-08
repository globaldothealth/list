import boto3
import re
from uuid import uuid4
from datetime import datetime, timedelta
from monthdelta import monthdelta

# Amazon weeks start on Sunday
WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

# Our file retention policy is twice the schedule period plus 10 days
GRACE_PERIOD_IN_DAYS = 10

def date_of_requested_weekday_in_month(weekday, week_of_month, year, month):
    # find the isoweekday of the first of the month
    first_of_month = datetime(year, month, 1)
    weekday_of_first = first_of_month.isoweekday()
    # subtract that from our weekday
    weekday_difference = weekday - weekday_of_first
    # add 7 if negative
    normalised_difference = weekday_difference if weekday_difference >= 0 else weekday_difference + 7
    # add one, as days of month are counted from 1
    first_requested_weekday = normalised_difference + 1
    # add 7*(week_of_month - 1) days
    return first_requested_weekday + (7 * (week_of_month - 1))


class ScheduleRule:
    """Representation of an EventBridge schedule rule"""
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

    def date_of_requested_weekday_in_month(self, weekday, week_of_month, year, month):
        return date_of_requested_weekday_in_month(weekday, week_of_month, year, month)

    def oldest_file_age(self, now):
        """
        What is the age in days of the oldest source file for an ingestion rule that we can keep?
        now: reference time from which to compute file age
        """
        assert self.is_ingestion_rule()
        schedule = self.schedule()
        if schedule.startswith('rate'):
            components = re.match(r'rate\(([0-9]+) ([a-z]+)\)', schedule)
            assert components is not None # I'm assuming the format is rate(1 day)
            assert components.group(2).startswith('day') # I'm assuming the unit is day or days
            number_of_days = int(components.group(1))
            assert number_of_days > 0 # I'm assuming a positive schedule
            age = timedelta(days = -2 * number_of_days - GRACE_PERIOD_IN_DAYS)
        else:
            assert schedule.startswith('cron') # I'm assuming that if it isn't a rate, it's a cron
            components = re.match(r'cron\(([0-9]+) ([0-9]+) (\?|\*) (\*) ([0-6]#[1-4]|[A-Z]{3}|[0-6]|\?) (\*)\)', schedule)
            assert components is not None # Assuming a restricted subset of https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html rules
            # I also assume that you never ask for the fifth weekday of the month, because that's a very odd schedule
            (minute, hour, day_of_month, month, day_of_week, year) = components.groups()
            # calculate from midnight as we don't want odd seconds etc
            today = datetime(now.year, now.month, now.day)
            our_day = today.isoweekday() % 7 # ISO runs 1-7 Mon-Sun, we want 0-6 Sun-Sat
            # Because of my assumptions above in the regex, I only need the day of the week here
            # When we are using Python 3.10+, this should be a match
            if day_of_week == '?':
                # will run on _a_ day of the week but don't know which, assume worst case
                age = timedelta(days = -14 - GRACE_PERIOD_IN_DAYS)
            elif day_of_week in WEEKDAYS:
                # what is the time between the last of these weekdays and today?
                their_day = WEEKDAYS.index(day_of_week)
                delta_days = self.difference_between_weekdays(our_day, their_day)
                age = timedelta(days = -delta_days - 7 - GRACE_PERIOD_IN_DAYS)
            elif len(day_of_week) == 1 and int(day_of_week) in range(7):
                delta_days = self.difference_between_weekdays(our_day, int(day_of_week))
                age = timedelta(days = -delta_days - 7 - GRACE_PERIOD_IN_DAYS)
            else:
                # format is weekday#week of month
                their_weekday = int(day_of_week[0])
                week_of_month = int(day_of_week[2])
                # find the requested day this month
                actual_requested_day = self.date_of_requested_weekday_in_month(their_weekday, week_of_month, today.year, today.month)
                # get the timedelta between that date and today
                days_until_requested_day_this_month = actual_requested_day - today.day
                # if the other date is today or in the future, get the equivalent date two months ago
                if days_until_requested_day_this_month >= 0:
                    date_in_target_month = today - monthdelta(2)
                # else get the equivalent date last month
                else:
                    date_in_target_month = today - monthdelta(1)
                # find the timedelta from today
                target_day = self.date_of_requested_weekday_in_month(their_weekday, week_of_month, date_in_target_month.year, date_in_target_month.month)
                target_date = datetime(date_in_target_month.year, date_in_target_month.month, target_day)
                difference = target_date - today
                # subtract the grace period
                age = difference - timedelta(days = GRACE_PERIOD_IN_DAYS)
        # we should have a result
        assert age is not None
        # it should be longer than the grace period
        assert age < timedelta(days = GRACE_PERIOD_IN_DAYS)
        return age
    
    def difference_between_weekdays(self, our_day, their_day):
        return our_day - their_day if our_day > their_day else our_day - their_day + 7


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
