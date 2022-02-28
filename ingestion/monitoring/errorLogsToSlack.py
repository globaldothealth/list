import json
import os
import requests
import re
from base64 import b64decode
from gzip import decompress
from io import StringIO

def decode(event):
    event_data = event["awslogs"]["data"]
    compressed = b64decode(event_data)
    uncompressed = decompress(compressed)
    decoded = json.loads(uncompressed)

    return decoded

def communicate(event):
    slack_url = os.getenv("SLACK_WEBHOOK")
    message_header = {'Content-Type': 'application/json'}
    message = {'text': event}
    response = requests.post(url=slack_url, data=json.dumps(message), headers=message_header)
    if response.status_code != 200:
        raise ValueError(
            'Request to slack returned an error %s, the response is:\n%s'
            % (response.status_code, response.text)
        )

def define_errortype(decoded):
    max_memory = False
    for e in decoded['logEvents']:
        if "'dateRange': {'start':".lower() in e["message"].lower():
            communicate("BACKFILL <@U01F70GPXNW>")
            for e in decoded['logEvents']:
                communicate(e["message"])
        if "error" in e["message"].lower():
            communicate("ERROR TYPE: Parser <@U011A0TFM7X> <@U017KLSPEM7>")
            print(e["message"])
            communicate(e["message"])
            return None
        if "filtering cases" in e["message"].lower():
            filter_message = e["message"]
        if "memory size" in e["message"].lower():
            memory_use = re.findall(r'\d* MB', e["message"])
            if len(set(memory_use)) == 1:
                max_memory = True
        if "timed out" in e["message"].lower():
            if max_memory == True:
                communicate("ERROR TYPE: Time out, max memory reached <@U011A0TFM7X> <@U017KLSPEM7>")
                print(e["message"])
                communicate(e["message"])
                return None
            else:
                communicate("ERROR TYPE: Time out, max memory NOT reached <@U01F70GPXNW>")
                print(filter_message)
                communicate(filter_message)
                print(e["message"])
                communicate(e["message"])
                return None

def lambda_handler(event, context):
    decoded = decode(event)
    print(decoded['logGroup'])
    communicate(decoded['logGroup'])
    define_errortype(decoded)
