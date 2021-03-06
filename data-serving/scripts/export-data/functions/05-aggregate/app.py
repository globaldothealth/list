import urllib.parse
import datetime
import csv
import io
import json
import os
import re

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

username = os.environ.get("MONGO_USERNAME")
password = os.environ.get("MONGO_PASSWORD")
print("Logging into MongoDB...")
client = pymongo.MongoClient(
    f"mongodb+srv://{username}:{password}@covid19-map-cluster01.sc7u9.mongodb.net/covid19?retryWrites=true&w=majority"
)
db = client.covid19
cases = db.cases
print("And we're in!")


def _quote_country(c):
    "Returns quoted country name used in query string of data url"
    cq = urllib.parse.quote_plus(c)
    return cq if len(c.split()) == 1 else f'"{cq}"'


def _coverage(gh, jhu):
    "Coverage expressed in percentage"
    return f"{gh/jhu:.0%}" if jhu > 0 else None


def _country_data_csv(d):
    "Convert from latest.json attributes to those used in latest.csv"
    return {
        'country': d['_id'],
        'data': f"https://data.covid-19.global.health/cases?country={_quote_country(d['_id'])}",
        'map': f"https://map.covid-19.global.health/#country/{d['code']}",
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
        print("Got status " + str(req.status_code) + " for '" + url + "'")
        date = date - datetime.timedelta(days=1)
        now = date.strftime("%m-%d-%Y")
        print(f"Checking for JHU data on {now}")
        url = f"https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/{now}.csv"
        req = requests.head(url, timeout=10)

    print(f"JHU data found for {now}.")
    print(f"Attempting to retrieve JHU data for {now}")
    req = requests.get(url, timeout=10)
    jhu_df = pd.read_csv(io.StringIO(req.text))
    print(f"Retrieved JHU case counts from {now}.")

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
    countrycodes_df["name"] = countrycodes_df["name"].apply(lambda x: _CODES_COUNTRY_MAP[x] if x in _CODES_COUNTRY_MAP.keys() else x)
    countrycodes_df = countrycodes_df.set_index('name')

    countrycodes_dict = countrycodes_df.to_dict('index')
    return countrycodes_dict


def generate_country_json():
    """
    Generate json of case counts by country and upload to S3.
    """
    now = datetime.datetime.now().strftime("%m-%d-%Y")
    pipeline = [
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
    with open("variants.json") as v:
        variant_counts = json.load(v)
    country_codes = get_country_codes()

    merged_countries = []
    for record in records:
        country = record["_id"]
        if country in variant_counts.keys():
            record["casecount_p1"] = variant_counts[country]["casecount_p1"]
            record["casecount_b1351"] = variant_counts[country]["casecount_b1351"]
            merged_countries.append(country)
        else:
            record["casecount_p1"] = 0
            record["casecount_b1351"] = 0
            merged_countries.append(country)

    for country in variant_counts.keys():
        if country not in merged_countries:
            records.append(variant_counts[country])

    for record in records:
        country = record["_id"]
        try:
            jhu = jhu_counts[country]
            record["jhu"] = int(jhu)
        except:
            print(f"I couldn't find {country} in the JHU case counts.")
            record["jhu"] = 0
        try:
            if country != "Namibia":
                code = country_codes[country]['country']
                record["code"] = code
            else:
                record["code"] = str("NA")
            record["lat"] = country_codes[country]['latitude']
            record["long"] = country_codes[country]['longitude']
        except:
            print(f"I couldn't find {country} in the list of country codes.")
            record["code"] = "ZZ"
            record["lat"] = -1.0
            record["long"] = -1.0

    records = {now: records}

    s3 = boto3.client("s3")
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket="covid-19-aggregates",
        Key="country/latest.json",
    )
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket="covid-19-aggregates",
        Key=f"country/{now}.json",
    )

    # generate CSV data
    _csv = records[now]

    csvstr = None
    with io.StringIO() as csvbuf:
        fieldnames = ['country', 'data', 'map', 'casecount_gh',
                      'casecount_jhu', 'coverage']
        writer = csv.DictWriter(csvbuf, fieldnames=fieldnames)
        writer.writeheader()
        for i in _csv:
            if i['_id']:
                writer.writerow(_country_data_csv(i))
        csvstr = csvbuf.getvalue()

    if csvstr:
        s3.put_object(
            ACL="public-read",
            Body=csvstr,
            Bucket="covid-19-aggregates",
            Key="country/latest.csv",
        )


def generate_region_json():
    """
    Generate json of case counts by region and upload to S3.
    """
    now = datetime.datetime.now().strftime("%m-%d-%Y")
    pipeline = [
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
                search_term = "country"
            new_record = {
                "_id": id,
                "casecount": record["casecount"],
                "country": record["country"],
                "lat": record["_id"]["latitude"],
                "long": record["_id"]["longitude"],
                "search": search_term,
            }
            print(new_record)
            records.append(new_record)
    records = {now: records}

    s3 = boto3.client("s3")
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket="covid-19-aggregates",
        Key="regional/latest.json",
    )
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(records),
        Bucket="covid-19-aggregates",
        Key=f"regional/{now}.json",
    )


def generate_total_json():
    """
    Generate json of total count of cases in MongoDB Atlas and upload to S3.
    """
    now = datetime.datetime.now().strftime("%m-%d-%Y")

    count = cases.count_documents({})

    with open("variants.json") as v:
        variant_counts = json.load(v)

    total_p1 = 0
    total_b1351 = 0
    for record in variant_counts.values():
        total_p1 += record["casecount_p1"]
        total_b1351 += record["casecount_b1351"]

    record = {
        "total": int(count),
        "total_p1": int(total_p1),
        "total_b1351": int(total_b1351),
    }

    s3 = boto3.client("s3")
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(record),
        Bucket="covid-19-aggregates",
        Key="total/latest.json",
    )
    s3.put_object(
        ACL="public-read",
        Body=json.dumps(record),
        Bucket="covid-19-aggregates",
        Key=f"total/{now}.json",
    )


def lambda_handler(event, context):
    """Generates aggregate data for Map and uploads to S3.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict specified by EventBridge.
    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    """
    print("Generating country json...")
    generate_country_json()
    print("Country json generated!")
    print("Generating region json...")
    generate_region_json()
    print("Region json generated!")
    print("Generating total json...")
    generate_total_json()
    print("Total json generated!")
    print("Done!")
