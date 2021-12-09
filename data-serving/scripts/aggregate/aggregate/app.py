#!/usr/bin/env python3

import csv
import datetime
import io
import json
import logging
import os
import re
import sys
import urllib.parse

import boto3
import pandas as pd
import pymongo
import requests

_JHU_COUNTRY_MAP = {
    "Czechia": "Czech Republic",
    "Korea South": "South Korea",
    # there are cases in G.h under both Algiers and Algeria
    "Algeria": "Algiers",
    "US": "United States",
    "Gibraltar, United Kingdom": 'Gibraltar',
    "Congo Kinshasa": "Democratic Republic of the Congo",
    "Cote dIvoire": "Cote d'Ivoire",
    "GuineaBissau": "Guinea-Bissau",
    "Congo Brazzaville": "Republic of Congo",
    "Virgin Islands, US": 'Virgin Islands, U.S.',
    "Reunion, France": 'Reunion',
    "Faroe Islands, Denmark": "Faroe Islands"
}

_CODES_COUNTRY_MAP = {
    "United States Virgin Islands": "Virgin Islands, U.S.",
    "Congo": "Republic of Congo",
    "Russian Federation": "Russia",
    "United Republic of Tanzania": "Tanzania",
    "Iran (Islamic Republic of)": "Iran",
    "Algeria": "Algiers",
    "Republic of Moldova": "Moldova",
    "Viet Nam": "Vietnam",
    "Bolivia (Plurinational State of)": "Bolivia",
    "Republic of Korea": "South Korea",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "Côte d'Ivoire": "Cote d'Ivoire",
    "United States of America": "United States",
    "Czechia": "Czech Republic",
    "The former Yugoslav Republic of Macedonia": "North Macedonia",
    "Réunion": "Reunion",
    "Congo [DRC]": "Democratic Republic of the Congo",
    "Congo [Republic]": "Republic of Congo",
    "Macedonia [FYROM]": "North Macedonia",
    "People's Republic of China": "China",
    "U.S. Virgin Islands": "Virgin Islands, U.S.",
    "Swaziland": "Eswatini",
    "Cape Verde": "Cabo Verde"
}

_CODES_COUNTRY_ADD = {
    "Kosovo": "XK",
    "Reunion": "RE",
    "Namibia": "NA",
    "Taiwan": "TW",
    "Faroe Islands": "FO",
}

_EXCLUDE = ["Puerto Rico"]



def setup_logger():
    h = logging.StreamHandler(sys.stdout)
    rootLogger = logging.getLogger()
    rootLogger.addHandler(h)
    rootLogger.setLevel(logging.DEBUG)


def _quote_country(c):
    "Returns quoted country name used in query string of data url"
    cq = urllib.parse.quote_plus(c)
    return cq if len(c.split()) == 1 else f'"{cq}"'


def _coverage(gh, jhu):
    "Coverage expressed in percentage"
    return f"{gh/jhu:.0%}" if jhu > 0 else None


def _country_data_csv(d, line_list_url, map_url):
    """
    Convert from latest.json attributes to those used in latest.csv
    d -- Record for a country
    line_list_url -- Base URL for the line list portal
    map_url -- Base URL for the map visualisation
    """
    return {
        'country': d['_id'],
        'data': f"{line_list_url}/cases?country={_quote_country(d['_id'])}",
        'map': f"{map_url}/#country/{d['code']}",
        'casecount_gh': d['casecount'],
        'casecount_jhu': d['jhu'],
        'coverage': _coverage(d['casecount'], d['jhu'])
    }


def get_jhu_counts():
    """
    Get latest case count .csv from JHU.

    Return aggregated counts by country as Series.
    """

    now = datetime.datetime.now().strftime("%m-%d-%Y")
    date = datetime.datetime.now()
    url = f"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/{now}.csv"
    req = requests.head(url, timeout=10)

    while req.status_code != 200:
        logging.info("Got status " + str(req.status_code) + " for '" + url + "'")
        date = date - datetime.timedelta(days=1)
        now = date.strftime("%m-%d-%Y")
        logging.info(f"Checking for JHU data on {now}")
        url = f"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/{now}.csv"
        req = requests.head(url, timeout=10)

    logging.info(f"JHU data found for {now}.")
    logging.info(f"Attempting to retrieve JHU data for {now}")
    req = requests.get(url, timeout=10)
    jhu_df = pd.read_csv(io.StringIO(req.text))
    logging.info(f"Retrieved JHU case counts from {now}.")

    jhu_counts = (
        jhu_df["Confirmed"].groupby(jhu_df["Country_Region"]).sum().reset_index()
    )
    jhu_counts["Country_Region"] = jhu_counts["Country_Region"].apply(
        lambda x: re.sub(r"[^a-zA-Z ]", "", x)
    )
    jhu_counts["Country_Region"] = jhu_counts["Country_Region"].apply(
        lambda x: _JHU_COUNTRY_MAP[x] if x in _JHU_COUNTRY_MAP.keys() else x
    )
    jhu_counts = jhu_counts.set_index("Country_Region")
    jhu_counts = pd.Series(jhu_counts.values.flatten(), index=jhu_counts.index)
    return jhu_counts


def get_country_codes():
    """
    Retrieve standardized country codes and coordinates.
    """
    url = "https://raw.githubusercontent.com/google/dspl/master/samples/google/canonical/countries.csv"
    req = requests.get(url, timeout=10)

    countrycodes_df = pd.read_csv(io.StringIO(req.text))
    countrycodes_df["name"] = countrycodes_df["name"].apply(lambda x: _CODES_COUNTRY_MAP.get(x, x))
    countrycodes_df = countrycodes_df.set_index('name')

    countrycodes_dict = countrycodes_df.to_dict('index')
    return countrycodes_dict


def generate_country_json(cases, s3_endpoint, bucket, date, line_list_url, map_url):
    """
    Generate json of case counts by country and upload to S3.
    cases -- The mongodb case collection.
    s3_endpoint -- API endpoint for S3 (None for default).
    bucket -- The S3 bucket identifier for the results to live in.
    date -- Formatted date used as a key for the output records.
    line_list_url -- Base URL to the line list data portal (e.g. 'https://data.covid-19.global.health')
    map_url -- Base URL to the map visualisation (e.g. 'https://map.covid-19.global.health')
    """
    pipeline = [
        {"$match": {"list": True}},
        {
            "$group": {
                "_id": "$location.country",
                "casecount": {"$sum": 1}
            }
        }
    ]

    results = cases.aggregate(pipeline)
    records = list(results)
    records = [record for record in records if record["_id"] not in _EXCLUDE]

    jhu_counts = get_jhu_counts()
    country_codes = get_country_codes()

    merged_countries = []
    for record in records:
        country = record["_id"]
        merged_countries.append(country)

    for record in records:
        country = record["_id"]
        if country is None:
            continue
        try:
            jhu = jhu_counts[country]
            record["jhu"] = int(jhu)
        except:
            logging.info(f"I couldn't find {country} in the JHU case counts.")
            record["jhu"] = 0
        try:
            if country != "Namibia":
                code = country_codes[country]['country']
                record["code"] = code
            else:
                record["code"] = str("NA")
            record["lat"] = country_codes[country]['latitude']
            record["long"] = country_codes[country]['longitude']
        except KeyError:
            raise ValueError(f"Could not find country in list of country codes: {country}")

    records = {date: records}

    s3 = boto3.client("s3", endpoint_url=s3_endpoint)
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket=bucket,
        Key="country/latest.json",
    )
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket=bucket,
        Key=f"country/{date}.json",
    )

    # generate CSV data
    _csv = records[date]

    csvstr = None
    with io.StringIO() as csvbuf:
        fieldnames = ['country', 'data', 'map', 'casecount_gh',
                      'casecount_jhu', 'coverage']
        writer = csv.DictWriter(csvbuf, fieldnames=fieldnames)
        writer.writeheader()
        for i in _csv:
            if i['_id']:
                writer.writerow(_country_data_csv(i, line_list_url, map_url))
        csvstr = csvbuf.getvalue()

    if csvstr:
        s3.put_object(
            ACL="public-read",
            Body=csvstr,
            Bucket=bucket,
            Key="country/latest.csv",
        )


def generate_region_json(cases, s3_endpoint, bucket, date):
    """
    Generate json of case counts by region and upload to S3.
    cases -- The mongodb case collection.
    s3_endpoint -- The API endpoint for S3 (None for default).
    bucket -- The destination S3 bucket.
    date -- Formatted date used as a key for the output records.
    """
    pipeline = [
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

    results = cases.aggregate(pipeline)
    raw_records = list(results)
    # Set null entries as equal to country
    # This could need more work in case of no admin3 but admin1/2 exists
    records = []
    for record in raw_records:
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
                id = record["country"]
                if id is None:
                    continue
                search_term = "country"
            new_record = {
                "_id": id,
                "casecount": record["casecount"],
                "country": record["country"],
                "lat": record["_id"]["latitude"],
                "long": record["_id"]["longitude"],
                "search": search_term,
            }
            logging.info(new_record)
            records.append(new_record)
    records = {date: records}

    s3 = boto3.client("s3", endpoint_url=s3_endpoint)
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket=bucket,
        Key="regional/latest.json",
    )
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket=bucket,
        Key=f"regional/{date}.json",
    )


def generate_total_json(cases, s3_endpoint, bucket, date):
    """
    Generate json of total count of cases in MongoDB Atlas and upload to S3.
    cases -- The mongodb case collection.
    s3_endpoint -- API endpoint for S3 (None for default).
    bucket -- The destination S3 bucket.
    date -- Formatted date used as a key for the output records.
    """
    count = cases.count_documents({"list": True})

    record = {
        "total": int(count),
    }

    s3 = boto3.client("s3", endpoint_url=s3_endpoint)
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(record),
        Bucket=bucket,
        Key="total/latest.json",
    )
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(record),
        Bucket=bucket,
        Key=f"total/{date}.json",
    )

def get_environment_value_or_bail(key):
    """
    Retrieve a value from the environment, but logging.info a message and quit if it isn't set.
    key -- The name of the environment variable.
    """
    value = os.environ.get(key)
    if value is None:
        logging.info(f"{key} not set in the environment, exiting")
        sys.exit(1)
    return value

if __name__ == '__main__':
    setup_logger()
    logging.info("Starting aggregation")
    connection_string = get_environment_value_or_bail("CONN")
    line_list_url = get_environment_value_or_bail("LINE_LIST_URL")
    map_url = get_environment_value_or_bail("MAP_URL")
    s3_bucket = get_environment_value_or_bail("S3_BUCKET")
    S3 endpoint is allowed to be None (i.e. connect to default S3 endpoint),
    # it's also allowed to be not-None (to use localstack or another test double).
    s3_endpoint = os.environ.get("S3_ENDPOINT")
    logging.info("Logging into MongoDB...")
    client = pymongo.MongoClient(connection_string)
    db = client.covid19
    cases = db.cases
    logging.info("And we're in!")

    date_string = datetime.datetime.now().strftime("%m-%d-%Y")
    logging.info("Generating country json...")
    generate_country_json(cases, s3_endpoint, s3_bucket, date_string, line_list_url, map_url)
    logging.info("Country json generated!")
    logging.info("Generating region json...")
    generate_region_json(cases, s3_endpoint, s3_bucket, date_string)
    logging.info("Region json generated!")
    logging.info("Generating total json...")
    generate_total_json(cases, s3_endpoint, s3_bucket, date_string)
    logging.info("Total json generated!")
    logging.info("Done!")
