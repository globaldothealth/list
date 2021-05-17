import os
import sys
import json
import operator
import requests
import tempfile
from pathlib import Path

import sys
import boto3

BUCKET = "covid-19-aggregates"
WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_METRICS_URL", None)


def to_isodate(d):
    mm, dd, yyyy = d.split("-")
    return f"{yyyy}-{mm}-{dd}"


def get_data(s3, bucket, key):
    data = None
    with tempfile.NamedTemporaryFile() as fout:
        s3.Object(bucket, key).download_file(fout.name)
        with open(fout.name) as fp:
            data = json.load(fp)
            if next(iter(data)) != Path(key).stem:  # next(iter(k)) gives first key of k
                print(f"Bucket key {key} does not match key in file {k0}, aborting.")
                sys.exit(1)
    return data


def diff(x, y):
    if y == x:
        return "= "
    return ("▲ " if y > x else "▼ ") + str(abs(y - x))


def compare(d1, d2):
    last_day = next(iter(d1))
    d1 = d1[last_day]
    today = next(iter(d2))
    d2 = d2[today]
    lines = []
    total1 = sum(x["casecount"] for x in d1)
    total2 = sum(x["casecount"] for x in d2)
    countries = [x["_id"] for x in d2 if x["casecount"]]
    lines.append(
        f"*{total2:,}* cases from *{len(set(countries))}* countries "
        + ("(including one null country)" if None in countries else "")
    )
    if total2 == total1:
        lines.append(f"No overall case count change from {last_day}")
    elif total2 > total1:
        lines.append(f"*New cases added*: {total2 - total1} since {last_day}\n")
    else:
        lines.append(f"*Cases dropped* ⚠️: {total2 - total1} since {last_day}\n")

    countries1 = {str(x["_id"]): x["casecount"] for x in d1 if x["casecount"]}
    countries2 = {str(x["_id"]): x["casecount"] for x in d2 if x["casecount"]}
    if c21 := sorted(set(countries2) - set(countries1)):
        lines.append("*Countries added*: " + ", ".join(c21))
        for k in c21:
            lines.append(f"- {k}: {countries2[k]} ")
    if c12 := sorted(set(countries1) - set(countries2)):
        lines.append("*Countries dropped*: " + ", ".join(c12))
        for k in c12:
            lines.append(f"- {k}: {countries1[k]} ")

    common_countries = []
    for c in sorted(set(countries1) & set(countries2)):
        if countries1[c] == countries2[c]:
            continue
        common_countries.append(
            f"- {c}: {countries2[c]} ({diff(countries1[c], countries2[c])})"
        )
    if common_countries:
        lines.append("*Country data additions/deletions*:")
        lines.extend(common_countries)

    return "\n".join(lines)


if __name__ == "__main__":
    s3 = boto3.resource("s3")
    bucket = s3.Bucket(BUCKET)
    today, last_day = sorted(
        [
            (x.key, to_isodate(Path(x.key).stem))
            for x in bucket.objects.filter(Prefix="country")
            if "latest" not in x.key
        ],
        key=operator.itemgetter(1),
        reverse=True,
    )[:2]
    d1 = get_data(s3, BUCKET, last_day[0])
    d2 = get_data(s3, BUCKET, today[0])
    ret = compare(d1, d2)
    print(ret)

    if WEBHOOK_URL:
        response = requests.post(WEBHOOK_URL, json={"text": ret})
        if response.status_code != 200:
            print(
                f"Slack notification failed with {response.status_code}: {response.text}"
            )
            sys.exit(1)
    if "⚠️" in ret:
        sys.exit(1)  # Trigger CI failure as an additional notification
