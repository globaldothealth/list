#!/bin/bash
# Sets up batch job definitions for the full export
# Depends: aws-cli

set -eou pipefail
source ./common.sh

IMAGE="${IMAGE:-$ECR/gdh-full-exporter:latest}"

function containerprops {
    # usage: containerprops "<country>"
    P='{'
    P+="\"image\": \"${IMAGE}\""
    P+=", \"vcpus\": 1, \"memory\": 2048, \"jobRoleArn\": \"${JOB_ROLE_ARN}\""
    P+=", \"environment\": [{\"name\": \"FORMAT\", \"value\": \"$1\" }]"
    P+='}'
    echo "$P"
}

for fmt in tsv csv json; do
    aws batch register-job-definition --job-definition-name "full-exporter-$fmt" \
        --container-properties "$(containerprops "$fmt")" \
        --timeout "attemptDurationSeconds=3600" --type container
done
