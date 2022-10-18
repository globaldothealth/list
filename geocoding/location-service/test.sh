#!/bin/bash

set -eou pipefail

DOCKERIZED=1 poetry run pytest .
echo "Tests and code quality checks passed"
