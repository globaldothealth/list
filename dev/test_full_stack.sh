#!/bin/bash
set -e
# Store current directory.
pushd `pwd`
# We have to run docker compose from this directory for it to pick up the .env file.
cd `dirname "$0"`
docker compose -f docker-compose.yml -f docker-compose.dev.full.test.yml up --build --force-recreate --renew-anon-volumes --exit-code-from test
# Restore directory.
popd
