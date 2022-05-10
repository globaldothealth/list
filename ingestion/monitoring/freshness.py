import os
import sys
import json
import logging
import operator
from typing import Any
from collections import defaultdict

import boto3
import requests

DEFAULT_INSTANCE = "https://data.covid-19.global.health"


def fetch_sources(api_key, instance):
    logging.info(f"Fetching sources from {instance}")
    content = {"nextPage": 1}
    N = 0
    total = 0
    sources = []
    # The second condition is to catch the last page
    # where nextPage is not defined, but N < total
    while page := content.get("nextPage") or N < total:
        res = requests.get(
            f"{instance}/api/sources?limit=100&page={page}",
            headers={
                "Content-Type": "application/json",
                "X-API-Key": api_key,
            },
        )
        if res.status_code != 200:
            logging.error(
                f"Failed to fetch sources, status={res.status_code}\n{res.content}"
            )
            return None
        else:
            content = res.json()
            total = content["total"]
            N += len(content["sources"])
            sources.extend(content["sources"])
    return sources


def last_upload_created(uploads: list[dict[str, Any]]):
    if not (
        accepted_uploads := [
            u for u in uploads if u["status"] == "SUCCESS" and u.get("accepted")
        ]
    ):
        return None
    return max(map(operator.itemgetter("created"), accepted_uploads))


def freshness(sources):
    logging.info("Getting freshness")
    _freshness = defaultdict(list)
    for source in sources:
        for cc in source.get("countryCodes", []):
            _freshness[cc].append(
                {
                    "name": source["name"],
                    "url": source["origin"]["url"],
                    "last_upload": last_upload_created(source["uploads"]),
                }
            )
    return _freshness


def upload(data, bucket, s3_endpoint=None):
    logging.info(f"Uploading data to {bucket}, with s3_endpoint={s3_endpoint}")
    s3 = boto3.client("s3", endpoint_url=s3_endpoint)
    try:
        s3.put_object(
            ACL="public-read",
            Body=json.dumps(data, indent=2, sort_keys=True),
            Bucket=bucket,
            Key="metrics/freshness.json",
        )
    except Exception as e:
        logging.error(f"Failed to upload with exception:\n{e}")


def setup_logger():
    h = logging.StreamHandler(sys.stdout)
    rootLogger = logging.getLogger()
    rootLogger.addHandler(h)
    rootLogger.setLevel(logging.INFO)


if __name__ == "__main__":
    setup_logger()
    if not (api_key := os.getenv("GDH_API_KEY")):
        raise ValueError("Set GDH_API_KEY to your Global.health API key")
    bucket = os.getenv("BUCKET", "covid-19-aggregates")
    s3_endpoint = os.getenv("S3_ENDPOINT")
    instance = os.getenv("GDH_URL", DEFAULT_INSTANCE)
    if sources := fetch_sources(api_key, instance):
        upload(freshness(sources), bucket, s3_endpoint)
