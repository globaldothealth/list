#!/bin/bash
# Sets up batch job definitions for the various countries
# Depends: jq aws-cli curl

set -eou pipefail
source ./common.sh

require_env "${ENV:-}" "Specify environment in ENV"
require_env "${CONN:-}" "Specify MongoDB connection string in CONN"
require_env "${BUCKET:-}" "Specify S3 bucket to output files in BUCKET"

echo "Setting up country export job definitions for environment {ENV}..."

CASECOUNT_URL=${CASECOUNT_URL:-https://covid-19-aggregates-eu.s3.amazonaws.com/country/latest.json}
# mongoexport rate in cases/s
# actual rate is higher, but this allows some wiggle room
# in calculation of Batch job timeouts
EXPORT_RATE=400
IMAGE="${IMAGE:-$ECR/gdh-country-exporter:latest}"
# ingestion role contains necessary permissions to access S3 buckets

function casecounts {
    curl -s -o - "$CASECOUNT_URL" |  jq -r 'to_entries[0].value[] | [._id, .casecount] | @tsv'
}

function containerprops {
    # usage: containerprops "<code>"
    cat << EOF
{
  "image": "$IMAGE",
  "vcpus": 2,
  "memory": 4096,
  "jobRoleArn": "$JOB_ROLE_ARN",
  "environment": [
     {"name": "COUNTRY", "value": "$1" }
   , {"name": "CONN", "value": "$CONN" }
   , {"name": "BUCKET", "value": "$BUCKET" }
  ]
}
EOF
}

casecounts | \
    while IFS=$'\t' read -r code casecount; do
        if [[ "$casecount" == "0" ]]; then
            continue
        fi
        if [[ "$casecount" -lt "$((EXPORT_RATE * 3600))" ]]; then
            timeout=3600  # allow minimum of 60 minutes for a job
        else
            timeout=$((casecount / EXPORT_RATE))
        fi
        printf '%s-exporter-%s; casecount=%d; timeout=%d\n' "$ENV" "$code" "$casecount" "$timeout"
        containerprops "${code}"
        aws batch register-job-definition --job-definition-name "${ENV}-exporter-${code}" \
            --container-properties "$(containerprops "${code}")" \
            --timeout "attemptDurationSeconds=${timeout}" --type container
    done
