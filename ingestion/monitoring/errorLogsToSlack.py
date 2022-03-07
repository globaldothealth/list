import argparse
import json
import logging
import os
import requests
import re
import sys
from time import sleep

import boto3


class SlackHandler(logging.Handler):
    def __init__(self, webhook_url, level=logging.NOTSET):
        super().__init__(level)
        self.slack_url = webhook_url
    
    def emit(self, record):
        message_header = {'Content-Type': 'application/json'}
        message = {'text': f"[{record.levelname}] {record.message}"}
        response = requests.post(url=self.slack_url, data=json.dumps(message), headers=message_header)
        if response.status_code == 429 and response['error'] == 'rate_limited':
            sleep(response['retry_after'])
        elif response.status_code != 200:
            raise ValueError(
                f"Request to slack returned an error {response.status_code}, the response is:\n{response.text}"
            )


def interpret(message):
    graham = "<@U011A0TFM7X>"
    abhishek = "<@U01F70FAJ6N>"
    jim = "<@U01TAHDR4F7>"
    engineers = f"{graham} {abhishek} {jim}"
    lower = message.lower()
    if "'dateRange': {'start':".lower() in lower:
        return (logging.INFO, f"BACKFILL INITIATED\n{message}")
    if "error" in lower:
        return (logging.ERROR, f"PARSER ERROR: {engineers}\n{message}")
    if "timed out" in lower:
        return (logging.ERROR, f"TIME OUT: {engineers}\n{message}")
    if lower.startswith('info:'):
        return (logging.INFO, message)
    return (logging.WARN, message)

def setup_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.WARN)
    stdoutHandler = logging.StreamHandler(stream=sys.stdout)
    stdoutHandler.setLevel(logging.DEBUG)
    logger.addHandler(stdoutHandler)
    slackHandler = SlackHandler(os.getenv('SLACK_WEBHOOK'), logging.DEBUG)
    logger.addHandler(slackHandler)
    return logger

def log_messages(cloudwatch_response, logger):
    for message in [e['message'] for e in cloudwatch_response['events']]:
        (severity, output) = interpret(message)
        logger.log(severity, output)


if __name__ == '__main__':
    logger = setup_logger()
    parser = argparse.ArgumentParser()
    parser.add_argument("group", help="AWS log group name for the failed parser")
    parser.add_argument("stream", help="AWS log stream name for the failed parser")
    args = parser.parse_args()
    logGroup = args.group
    logStream = args.stream
    if logGroup is None or logStream is None:
        logger.critical(f"Cannot get messages from log group {logGroup} and stream {logStream}")
        sys.exit(1)
    logger.info(f"Output from {logGroup}/{logStream}:")
    hasMore = False
    oldNext = ''
    logClient = boto3.client('logs', region_name=os.getenv('AWS_REGION'))
    response = logClient.get_log_events(
        logGroupName=logGroup,
        logStreamName=logStream,
        startFromHead=True
    )
    log_messages(response, logger)
    oldNext = response['nextForwardToken']
    if oldNext and len(oldNext) > 0:
        hasMore = True
    while hasMore:
        response = logClient.get_log_events(
            logGroupName=logGroup,
            logStreamName=logStream,
            startFromHead=True,
            nextToken=oldNext
        )
        log_messages(response, logger)
        newNext = response['nextForwardToken']
        if (not newNext) or (newNext == oldNext):
            hasMore = False
        else:
            oldNext = newNext
    logger.info(f"End of output from {logGroup}/{logStream}")
