#!/bin/bash

set -eo pipefail

pushd "$(dirname $0)"

function cleanup() {
  docker compose -f docker-compose-test.yml stop
  docker compose -f docker-compose-test.yml down -v --remove-orphans
  popd
}

trap cleanup EXIT

docker compose -f docker-compose-test.yml up --build --exit-code-from test
