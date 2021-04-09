#!/bin/bash

set -eou pipefail

if [ "$DOCKERIZED" == "True" ] ; then
  echo "Waiting for S3 at ${AWS_ENDPOINT}/health, checking every 5s"
  until $(curl --silent --fail ${AWS_ENDPOINT}/health | grep "\"s3\": \"running\"" > /dev/null); do
    echo "Waiting 5s"
    sleep 5
  done
fi

python3 -m pytest .
echo "Tests and code quality checks passed"
