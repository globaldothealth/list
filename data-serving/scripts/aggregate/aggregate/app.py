#!/usr/bin/env python3

import datetime
import json
import logging
import os
import sys
import urllib
from typing import Any, Callable, Optional

import boto3
import pandas as pd
import pymongo
import iso3166


# S3 endpoint is allowed to be None (i.e. connect to default S3 endpoint),
# it's also allowed to be not-None (to use localstack or another test double).
S3 = boto3.client("s3", endpoint_url=os.environ.get("S3_ENDPOINT"))
today = datetime.datetime.now().date()


_JHU_COUNTRY_MAP = {
    "Congo (Kinshasa)": "CD",
    "Korea, South": "KR",
    "Syria": "SY",
    "Laos": "LA",
    "Micronesia": "FM",
    "Iran": "IR",
    "Taiwan*": "TW",
    "Venezuela": "VE",
    "Tanzania": "TZ",
    "Cote d'Ivoire": "CI",
    "United Kingdom": "GB",
    "Russia": "RU",
    "Brunei": "BN",
    "Bolivia": "BO",
    "Moldova": "MD",
    "Vietnam": "VN",
    "Congo (Brazzaville)": "CG",
    "Burma": "MM",
}

# Overseas territories (OT) with their own ISO 3166 codes
_JHU_OT_MAP = {
    ("Reunion", "France"): "RE",
    ("Virgin Islands", "US"): "VI",
    ("Gibraltar", "United Kingdom"): "GI",
}

# MongoDB aggregation pipeline for regional data
_REGION_PIPELINE = [
    {"$match": {"list": True}},
    {
        "$project": {
            "_id": 0,
            "location.country": 1,
            "location.administrativeAreaLevel1": 1,
            "location.administrativeAreaLevel2": 1,
            "location.administrativeAreaLevel3": 1,
            "location.geometry.latitude": 1,
            "location.geometry.longitude": 1,
        }
    },
    {
        "$group": {
            "_id": {
                "latitude": "$location.geometry.latitude",
                "longitude": "$location.geometry.longitude",
            },
            "casecount": {"$sum": 1},
            "country": {"$first": "$location.country"},
            "admin1": {"$first": "$location.administrativeAreaLevel1"},
            "admin2": {"$first": "$location.administrativeAreaLevel2"},
            "admin3": {"$first": "$location.administrativeAreaLevel3"},
        }
    },
]

# MongoDB aggregation pipeline for country casecount data
_COUNT_PIPELINE = [
    {"$match": {"list": True}},
    {"$group": {"_id": "$location.country", "casecount": {"$sum": 1}}},
]


def get_geocodes() -> dict[dict[str, float]]:
    "Load geocodes file"
    with open("geocoding_countries.json") as fp:
        data = json.load(fp)
    return {k: {"lat": data[k][0], "long": data[k][1]} for k in data}


GEOCODES = get_geocodes()


def jhu_url(date: datetime.date) -> str:
    "Returns JHU case count url for a given date"
    date_str = date.strftime("%m-%d-%Y")
    return (
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/"
        f"csse_covid_19_data/csse_covid_19_daily_reports/{date_str}.csv"
    )


def map_jhu_country_code(row: dict[str, Any]) -> Optional[str]:
    "Gets country code from a row of JHU data"
    try:
        return (
            _JHU_OT_MAP.get((row["Province_State"], row["Country_Region"]))
            or _JHU_COUNTRY_MAP.get(row["Country_Region"])
            or iso3166.countries.get(row["Country_Region"]).alpha2
        )
    except KeyError:
        logging.debug(f"Failed to map country code from {row['Province_State']}, {row['Country_Region']}")
        return None


def transform_jhu_counts(df: pd.DataFrame) -> Optional[dict[str, int]]:
    df["Country"] = df.apply(map_jhu_country_code, axis=1)
    df = df[pd.notnull(df.Country)]
    try:
        return (
            df[["Country", "Confirmed"]]
            .groupby("Country")
            .agg("sum")
            .to_dict()["Confirmed"]
        )
    except Exception as e:
        logging.error(f"Failed to transform JHU counts:\n{e}")
        return None


def get_jhu_counts() -> Optional[dict[str, int]]:
    "Return today's, if not available, yesterday's JHU counts"
    try:
        logging.info(f"Fetching JHU count for {today}")
        return transform_jhu_counts(pd.read_csv(jhu_url(today)))
    except urllib.error.HTTPError:
        yesterday = today - datetime.timedelta(days=1)
        logging.info(f"Fetching JHU count for {yesterday}")
        return transform_jhu_counts(pd.read_csv(jhu_url(yesterday)))


def upload(data: str, bucket: str, keys: list[str]):
    """Upload data to S3

    data -- Data to upload as a string
    bucket -- S3 bucket to upload to
    keys -- List of S3 paths to upload to
    """
    try:
        logging.info(f"Uploading data to {keys} in {bucket}")
        for key in keys:
            S3.put_object(
                ACL="public-read",
                Body=data,
                Bucket=bucket,
                Key=key,
            )
    except Exception:
        logging.error(f"Failed to upload data to s3://{bucket}/{key}")


def country_name(c: str) -> Optional[str]:
    "Returns official country name from country code"
    try:
        return iso3166.countries.get(c).name
    except KeyError:
        return None


def counts_csv_row(record, line_list_url, map_url):
    """
    Convert from latest.json attributes to those used in latest.csv

    record-- Record for a country
    line_list_url -- Base URL for the line list portal
    map_url -- Base URL for the map visualisation
    """
    casecount = record.get("casecount")
    jhu_count = record.get("jhu")
    code = record.get("_id")
    return {
        "country": country_name(code),
        "data": f"{line_list_url}/cases?country={code}",
        "map": f"{map_url}/#country/{code}",
        "casecount_gh": casecount,
        "casecount_jhu": jhu_count,
        "coverage": f"{casecount/jhu_count:.0%}" if (jhu_count and casecount) else "",
    }


def counts_dataframe(counts, line_list_url, map_url):
    "Transforms casecounts as dict to dataframe"
    return pd.DataFrame([counts_csv_row(c, line_list_url, map_url) for c in counts])


def transform_counts(
    counts: list[dict[str, Any]], jhu_counts: dict[str, int] = None
) -> list[dict[str, Any]]:
    """
    Transforms aggregated casecount data for map

    counts -- Case counts as a list of records of the form
              [{"_id": "two-letter country code", "casecount": N}, ... ]
    jhu_counts -- JHU case counts, optional. If not specified, fetches latest
    """
    jhu_counts = jhu_counts or get_jhu_counts()
    if jhu_counts is None:
        raise ValueError("Failed to obtain JHU counts")
    for record in counts:
        cc = record["_id"]
        record["code"] = cc
        if cc not in jhu_counts:
            logging.warning(f"Not found in JHU: {cc}")
        if cc not in GEOCODES:
            logging.warning(f"Not found in GEOCODES: {cc}")

        record["jhu"] = jhu_counts.get(cc, 0)
        record.update(GEOCODES.get(cc, {}))
    return counts


def transform_regions(regions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Transform aggregated region data for map

    regions -- aggregated data from region pipeline
    """
    records = []
    for record in regions:
        if "latitude" in record["_id"].keys():
            if record["admin3"]:
                id = record["admin3"]
                search_term = "admin3"
            elif record["admin2"]:
                id = record["admin2"]
                search_term = "admin2"
            elif record["admin1"]:
                id = record["admin1"]
                search_term = "admin1"
            else:
                id = country_name(record["country"])
                if id is None:
                    continue
                search_term = "country"
            new_record = {
                "_id": id,
                "casecount": record["casecount"],
                "country": country_name(record["country"]),
                "country_code": record["country"],
                "admin1": record["admin1"],
                "admin2": record["admin2"],
                "admin3": record["admin3"],
                "lat": record["_id"]["latitude"],
                "long": record["_id"]["longitude"],
                "search": search_term,
            }
            logging.info(new_record)
            records.append(new_record)
    return records


def run_and_upload(
    folder: str,
    collection: pymongo.collection.Collection,
    pipeline: list[dict[str, Any]],
    transform: Callable[[list[dict[str, Any]]], list[dict[str, Any]]],
    bucket: str,
    date: datetime.date,
):
    """Orchestrates running pipeline and uploading results to S3 bucket

    folder -- Folder in S3 bucket to place files
    collection -- PyMongo collection to run aggregation pipeline on
    pipeline -- MongoDB aggregation pipeline
    transform -- Transformation function to apply to aggregated data
    bucket -- S3 bucket to upload data to
    date -- Date to use as timestamp key in uploaded data
    """
    logging.info(f"Generating {folder} json...")
    date_str = date.strftime("%m-%d-%Y")
    data = transform(list(collection.aggregate(pipeline)))
    upload(
        json.dumps({date_str: data}), bucket, [f"{folder}/latest.json", f"{folder}/{date_str}.json"]
    )
    return data


def setup_logger():
    h = logging.StreamHandler(sys.stdout)
    rootLogger = logging.getLogger()
    rootLogger.addHandler(h)
    rootLogger.setLevel(logging.INFO)


if __name__ == "__main__":
    setup_logger()
    if envs := {"CONN", "LINE_LIST_URL", "MAP_URL", "S3_BUCKET"} - set(os.environ):
        logging.info(f"Required {envs} not set in the environment, exiting")
        sys.exit(1)
    logging.info("Starting aggregation")
    bucket = os.environ.get("S3_BUCKET")

    logging.info("Logging into MongoDB...")
    client = pymongo.MongoClient(os.getenv("CONN"))
    db = client.covid19
    cases = db.cases
    logging.info("And we're in!")

    counts = run_and_upload(
        "country", cases, _COUNT_PIPELINE, transform_counts, bucket, date=today
    )
    counts_df = counts_dataframe(
        counts, os.getenv("LINE_LIST_URL"), os.getenv("MAP_URL")
    )
    total = sum(cc["casecount"] for cc in counts)
    upload(
        json.dumps({"total": total}),
        bucket,
        ["total/latest.json", f"total/{today.strftime('%m-%d-%Y')}.json"],
    )
    upload(counts_df.to_csv(index=False), bucket, ["country/latest.csv"])

    run_and_upload(
        "regional", cases, _REGION_PIPELINE, transform_regions, bucket, date=today
    )
