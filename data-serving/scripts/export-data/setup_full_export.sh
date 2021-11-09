#!/bin/bash
# Sets up batch job definitions for the full export
# Depends: aws-cli

set -eou pipefail
source ./common.sh
require_env "${ENV:-}" "Specify environment in ENV"
require_env "${COUNTRY_EXPORT_BUCKET:-}" "Specify COUNTRY_EXPORT_BUCKET"
require_env "${FULL_EXPORT_BUCKET:-}" "Specify FULL_EXPORT_BUCKET"
IMAGE="${IMAGE:-$ECR/gdh-full-exporter:latest}"

echo "Setting up full expotr job definitions for environment ${ENV}..."
echo "Will tar files from ${COUNTRY_EXPORT_BUCKET} -> ${FULL_EXPORT_BUCKET}"

function containerprops {
    # usage: containerprops "<country>"
    cat <<EOF
{
  "image": "$IMAGE",
  "vcpus": 1,
  "memory": 2048,
  "jobRoleArn": "$JOB_ROLE_ARN",
  "environment": [
     {"name": "FORMAT", "value": "$1"}
   , {"name": "COUNTRY_EXPORT_BUCKET", "value": "$COUNTRY_EXPORT_BUCKET"}
   , {"name": "FULL_EXPORT_BUCKET", "value": "$FULL_EXPORT_BUCKET"}
  ]
}
EOF
}

for fmt in tsv csv json; do
    aws batch register-job-definition --job-definition-name "${ENV}-full-exporter-${fmt}" \
        --container-properties "$(containerprops "$fmt")" \
        --timeout "attemptDurationSeconds=3600" --type container
done
