#!/bin/bash

set -eou pipefail

if [ "$DOCKERIZED" == "True" ] ; then
  ./setup_s3_test.sh
fi

python3 -m pytest .
echo "Tests and code quality checks passed"
