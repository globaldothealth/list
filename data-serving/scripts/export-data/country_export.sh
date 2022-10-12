#!/bin/bash

set -euo pipefail

source ./common.sh
require_env "${CONN:-}" "Specify MongoDB connection string in CONN"
require_env "${BUCKET:-}" "Specify S3 bucket to output files in BUCKET"
require_env "${COUNTRY:-}" "Specify which country code to export in COUNTRY"

SCRATCH="$(mktemp -d)"
BUCKETS="${SCRATCH}/buckets.json"
trap 'rm -rf "$SCRATCH"' EXIT  # Cleanup before exit

FORMAT="${FORMAT:-csv,tsv,json}"
QUERY="{\"list\": true, \"location.country\": \"$COUNTRY\"}"

mongoexport --uri="$CONN" --collection=ageBuckets --type=json --jsonArray -o "${BUCKETS}"
mongoexport --query="$QUERY" --uri="$CONN" --collection=cases \
    --fieldFile=fields.txt --type=csv | python3 transform.py -f "$FORMAT" -b "${BUCKETS}" "$COUNTRY"

# ignore shellcheck warning on word splitting, as it's actually needed here
# shellcheck disable=SC2086
for fmt in ${FORMAT//,/ }
do
   test -f "${COUNTRY}.${fmt}.gz" && aws s3 cp "${COUNTRY}.${fmt}.gz" "s3://${BUCKET}/${fmt}/"
done
