#!/bin/bash
# Sets up batch job definitions for the various countries
# Depends: jq aws-cli

set -eou pipefail

CASECOUNT_URL="https://covid-19-aggregates.s3.amazonaws.com/country/latest.json"
# mongoexport rate in cases/s
# actual rate is higher, but this allows some wiggle room
# in calculation of Batch job timeouts
EXPORT_RATE=400
IMAGE="${IMAGE:-612888738066.dkr.ecr.us-east-1.amazonaws.com/gdh-country-exporter:latest}"
# ingestion role contains necessary permissions to access S3 buckets
JOB_ROLE_ARN="arn:aws:iam::612888738066:role/gdh-ingestion-job-role"

function casecounts {
    curl -s -o - "$CASECOUNT_URL" |  jq -r 'to_entries[0].value[] | [._id, .casecount] | @tsv'
}

function containerprops {
    # usage: containerprops "<country>"
    P='{'
    P+="\"image\": \"${IMAGE}\""
    P+=", \"vcpus\": 2, \"memory\": 4096, \"jobRoleArn\": \"${JOB_ROLE_ARN}\""
    P+=", \"environment\": [{\"name\": \"COUNTRY\", \"value\": \"$1\" }]"
    P+='}'
    echo "$P"
}

casecounts | \
    while IFS=$'\t' read -r country casecount; do
        if [[ "$casecount" == "0" ]]; then
            continue
        fi
        if [[ "$casecount" -lt "$((EXPORT_RATE * 1800))" ]]; then
            timeout=1800  # allow minimum of 30 minutes for a job
        else
            timeout=$((casecount / EXPORT_RATE))
        fi
        slug=$(echo "${country}" | sed "s/ /_/g;s/[.,']//g" | tr '[:upper:]' '[:lower:]')
        printf 'exporter_%s; casecount=%d; timeout=%d\n' "$slug" "$casecount" "$timeout"
        echo "$(containerprops "${country}")"
        aws batch register-job-definition --job-definition-name "exporter_${slug}" \
            --container-properties "$(containerprops "${country}")" \
            --timeout "attemptDurationSeconds=${timeout}" --type container
    done
