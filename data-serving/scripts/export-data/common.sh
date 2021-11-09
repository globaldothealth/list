#!/bin/bash
export ECR=612888738066.dkr.ecr.us-east-1.amazonaws.com
# ingestion role contains necessary permissions to access S3 buckets
export JOB_ROLE_ARN="arn:aws:iam::612888738066:role/gdh-ingestion-job-role"

require_env() {
    if [ -z "$1" ]; then
        echo "$2"
        exit 1
    fi
}
