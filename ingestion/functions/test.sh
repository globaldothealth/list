#!/bin/bash

set -eou pipefail

if [ "$DOCKERIZED" == "True" ] ; then
  ./setup_s3.sh
fi

python3 -m pytest .
echo "Tests and code quality checks passed"
