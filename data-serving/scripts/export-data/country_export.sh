#!/bin/bash

set -euo pipefail

SLUG=$(echo "$COUNTRY" | sed "s/ /_/g;s/[.,']//g" | tr '[:upper:]' '[:lower:]')
QUERY="{\"list\": true, \"location.country\": \"$COUNTRY\"}"
mongoexport --query="$QUERY" --uri="$CONN" --collection=cases \
    --fieldFile=fields.txt --type=csv | python3 transform.py | gzip > "$SLUG.csv.gz"
aws s3 cp "$SLUG.csv.gz" s3://covid-19-country-export/csv/
