#!/bin/bash

# This won't do much on it's own at present.
# It needs the curator running at localhost:3001.

set -eo pipefail

function cleanup() {
  docker-compose stop
  docker-compose down -v --remove-orphans
}

trap cleanup EXIT

docker-compose -f docker-compose.yml up --build
