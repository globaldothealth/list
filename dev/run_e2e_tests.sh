#!/bin/bash

set -eou pipefail

echo "Setting up localstack"
python3 setup_localstack.py
echo "Setting up ingestion environment"
python3 setup_ingestion.py
echo "Waiting for batch jobs"
sleep 10
echo "Running all parser batch jobs"
python3 parsing.py run

echo "Running end-to-end tests"
python3 -m pytest -rs -v .
echo "Tests complete"