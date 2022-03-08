import logging
import os
import requests
import sys

handlers = set()

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

def getLogger(module_name):
    logger = logging.getLogger(module_name)
    logger.setLevel(logging.DEBUG)
    if not logger.hasHandlers():
        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        handlers.add(handler)
        if slack_webhook := os.getenv('SLACK_LOGS_WEBHOOK'):
            slackHandler = SlackHandler(slack_webhook, logging.WARNING)
            logger.addHandler(slackHandler)
            handlers.add(slackHandler)
    return logger

def flushAll():
    for handler in handlers:
        handler.flush()
