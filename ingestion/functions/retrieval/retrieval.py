import json
import requests


def lambda_handler(event, context):
    """Global ingestion retrieval function.

    Will be used to scrape source content and persist it to S3.
    For now, logs and returns the IP of the machine on which it executes.
    For more information on logging, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-logging.html

    Parameters
    ----------
    event: dict, required
        In the canonical CloudWatch ScheduledEvent format.
        For more information, see:
          https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type

    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    JSON object containing the machine IP.

       For more information on return types, see:
         https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    try:
        ip = requests.get("http://checkip.amazonaws.com/").text.strip()
        print(ip)
        return {"ip": ip}
    except requests.RequestException as e:
        print(e)
        raise e
