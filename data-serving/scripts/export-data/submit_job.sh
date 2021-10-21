#!/bin/bash

if [[ -z "$1" ]]; then
    echo "usage: submit_job.sh exporter_<country-slug>"
    echo "       where exporter_<country-slug> is the job definition name"
    exit 1
fi
aws batch submit-job --job-name "$1" --job-queue export-queue --job-definition "$1"
