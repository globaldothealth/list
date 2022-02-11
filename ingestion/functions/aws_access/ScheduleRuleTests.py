import unittest
from datetime import datetime, timedelta
from .EventBridgeClient import EventBridgeClient, date_of_requested_weekday_in_month


class ScheduleRuleTests(unittest.TestCase):
    real_ingestion_rule = {
        'Arn': 'arn:aws:events:us-east-1:612888738066:rule/taiwan-taiwan-ingestor-prod',
        'Description': 'Scheduled Batch ingestion rule for source: Taiwan with ID: '
                        '5f7796ece78c6866f6f676e0 for environment: prod',
        'EventBusName': 'default',
        'Name': 'taiwan-taiwan-ingestor-prod',
        'ScheduleExpression': 'rate(1 day)',
        'State': 'ENABLED'
    }

    real_non_ingestion_rule = {
        'Arn': 'arn:aws:events:us-east-1:612888738066:rule/testy',
        'Description': 'Delete me',
        'EventBusName': 'default',
        'Name': 'testy',
        'ScheduleExpression': 'cron(1 0 * * ? *)',
        'State': 'DISABLED'
    }

    first_of_january_2022 = datetime(2022, 1, 1) # was a Saturday

    def test_description(self):
        rule_definition = {
            "Description": "A test rule."
        }
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.description() == "A test rule."
    
    def test_schedule(self):
        rule_definition = {
            "ScheduleExpression": "rate(1 day)"
        }
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.schedule() == "rate(1 day)"

    def test_ingestion_rule_positive(self):
        rule = EventBridgeClient.rule_for_description(ScheduleRuleTests.real_ingestion_rule)
        assert rule.is_ingestion_rule()

    def test_ingestion_rule_negative(self):
        rule = EventBridgeClient.rule_for_description(ScheduleRuleTests.real_non_ingestion_rule)
        assert not rule.is_ingestion_rule()
    
    def test_retrieve_ingestion_source_id(self):
        rule = EventBridgeClient.rule_for_description(ScheduleRuleTests.real_ingestion_rule)
        assert rule.ingestion_source_id() == '5f7796ece78c6866f6f676e0'

    def test_oldest_file_age_for_rate_schedule(self):
        rule = EventBridgeClient.rule_for_description(ScheduleRuleTests.real_ingestion_rule)
        assert rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022) == timedelta(days = -12)
    
    def test_oldest_file_age_for_any_weekday(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * ? *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022) == timedelta(days = -24)

    def test_oldest_file_age_for_named_weekday_same_as_today(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * SAT *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022) == timedelta(days = -24)

    def test_oldest_file_age_for_named_weekday_other_today(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * THU *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022) == timedelta(days = -19)
    
    def test_oldest_file_age_for_named_weekday_other_today_on_sunday(self):
        # this is a boundary test: sunday is day 0 on AWS, day 7 in Python
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * THU *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.oldest_file_age(datetime(2022, 1, 2)) == timedelta(days = -20)

    def test_oldest_file_age_for_numbered_weekday(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * 6 *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        assert rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022) == timedelta(days = -24)

    def test_oldest_file_age_for_first_numbered_weekday_in_month_same_as_today(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * 6#1 *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        age = rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022)
        oldest_date = ScheduleRuleTests.first_of_january_2022 + age
        assert oldest_date == (datetime(2021, 11, 6) + timedelta(days = -10)) #first Sat two months earlier plus grace period

    def test_oldest_file_age_for_second_numbered_weekday_that_has_yet_to_occur(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * 6#2 *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        age = rule.oldest_file_age(ScheduleRuleTests.first_of_january_2022)
        oldest_date = ScheduleRuleTests.first_of_january_2022 + age
        assert oldest_date == (datetime(2021, 11, 13) + timedelta(days = -10)) #second Sat two months earlier plus grace period
        
    def test_oldest_file_age_for_first_numbered_weekday_in_month_that_already_passed(self):
        rule_definition = dict(ScheduleRuleTests.real_ingestion_rule)
        rule_definition['ScheduleExpression'] = 'cron(17 17 * * 6#1 *)'
        rule = EventBridgeClient.rule_for_description(rule_definition)
        second_jan_2022 = datetime(2022, 1, 2) # sunday
        age = rule.oldest_file_age(second_jan_2022)
        oldest_date = second_jan_2022 + age
        assert oldest_date == (datetime(2021, 12, 4) + timedelta(days = -10)) #first Sat one month earlier plus grace period

    def test_target_weekday_calculation(self):
        # first saturday of the month in January 2022 is Saturday Jan 1 2022
        target_day = date_of_requested_weekday_in_month(6, 1, ScheduleRuleTests.first_of_january_2022.year, ScheduleRuleTests.first_of_january_2022.month)
        assert target_day == 1
    
    def test_more_complex_target_weekday_calculation(self):
        # first saturday of the month in November 2021 is Saturday Nov 6 2021
        target_day = date_of_requested_weekday_in_month(6, 1, 2021, 11)
        assert target_day == 6

if __name__ == '__main__':
    unittest.main()