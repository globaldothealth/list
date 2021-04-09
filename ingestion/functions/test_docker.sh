#!/bin/bash

set -eo pipefail

function cleanup() {
  docker-compose stop
  docker-compose down -v --remove-orphans
}

trap cleanup EXIT

docker-compose -f docker-compose-test.yml up --build --exit-code-from test
