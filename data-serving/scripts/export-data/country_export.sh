#!/bin/bash

set -euo pipefail

FORMAT="${FORMAT:-csv,tsv,json}"
SLUG=$(echo "$COUNTRY" | sed "s/ /_/g;s/[.,']//g" | tr '[:upper:]' '[:lower:]')
QUERY="{\"list\": true, \"location.country\": \"$COUNTRY\"}"
mongoexport --query="$QUERY" --uri="$CONN" --collection=cases \
    --fieldFile=fields.txt --type=csv | python3 transform.py -f "$FORMAT" "$SLUG"

for fmt in ${FORMAT//,/ }
do
    aws s3 cp "$SLUG.$fmt.gz" s3://covid-19-country-export/$fmt/
done
