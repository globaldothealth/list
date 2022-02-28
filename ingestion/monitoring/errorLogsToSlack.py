import json
import logging
import os
import requests
import re
import sys

import boto3


class SlackHandler(logging.Handler):
    def __init__(self, webhook_url, level=logging.NOTSET):
        super().__init__(level)
        self.slack_url = webhook_url
    
    def emit(self, record):
        message_header = {'Content-Type': 'application/json'}
        message = {'text': f"[{record.levelname}] {record.message}"}
        response = requests.post(url=self.slack_url, data=json.dumps(message), headers=message_header)
        if response.status_code != 200:
            raise ValueError(
                f"Request to slack returned an error {response.status_code}, the response is:\n{response.text}"
            )


def interpret(message):
    lower = message.lower()
    if "'dateRange': {'start':".lower() in lower:
        return (logger.INFO, f"BACKFILL <@U01F70GPXNW>\n{message}")
    if "error" in lower:
        return (logger.ERROR, f"ERROR TYPE: Parser <@U011A0TFM7X> <@U017KLSPEM7>\n{message}")
    if "timed out" in lower:
        return (logger.ERROR, f"ERROR TYPE: Time out\n{message}")
    return (logger.WARN, message)

def setup_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    stdoutHandler = logging.StreamHandler(stream=sys.stdout)
    stdoutHandler.setLevel(logging.DEBUG)
    logger.addHandler(stdoutHandler)
    slackHandler = SlackHandler(os.getenv('SLACK_WEBHOOK'), logging.DEBUG)
    logger.addHandler(slackHandler)
    return logger


if __name__ == '__main__':
    logger = setup_logger()
    logGroup = os.getenv('INGESTION_LOG_GROUP')
    logStream = os.getenv('INGESTION_LOG_STREAM')
    if logGroup is None or logStream is None:
        logger.critical(f"Cannot get messages from log group {logGroup} and stream {logStream}")
        sys.exit(1)
    logger.info(f"Output from {logGroup}/{logStream}:")
    hasMore = True
    oldNext = None
    logClient = boto3.client('logs')
    while hasMore:
        response = logClient.get_log_events(
            logGroupName=logGroup,
            logStreamName=logStream,
            startFromHead=True,
            nextToken=oldNext
        )
        newNext = response['nextForwardToken']
        if (not newNext) or (newNext == oldNext):
            hasMore = False
        else:
            oldNext = newNext
        for message in [e['message'] for e in response['events']]:
            (severity, output) = interpret(message)
            logger.log(severity, output)
    logger.info(f"End of output from {logGroup}/{logStream}")
