#!/bin/bash
set -eou pipefail
echo "==> Testing age bucket transition"
./age-buckets-transition/test_docker.sh
