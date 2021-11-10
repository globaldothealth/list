#!/bin/bash

set -euo pipefail

source ./common.sh
require_env "${CONN:-}" "Specify MongoDB connection string in CONN"
require_env "${BUCKET:-}" "Specify S3 bucket to output files in BUCKET"
require_env "${COUNTRY:-}" "Specify which country to export in COUNTRY"

FORMAT="${FORMAT:-csv,tsv,json}"
SLUG=$(echo "$COUNTRY" | sed "s/ /_/g;s/[.,']//g" | tr '[:upper:]' '[:lower:]')
QUERY="{\"list\": true, \"location.country\": \"$COUNTRY\"}"
mongoexport --query="$QUERY" --uri="$CONN" --collection=cases \
    --fieldFile=fields.txt --type=csv | python3 transform.py -f "$FORMAT" "$SLUG"

# ignore shellcheck warning on word splitting, as it's actually needed here
# shellcheck disable=SC2086
for fmt in ${FORMAT//,/ }
do
    test -f "${SLUG}.${fmt}.gz" && aws s3 cp "${SLUG}.${fmt}.gz" "s3://${BUCKET}/${fmt}/"
done
