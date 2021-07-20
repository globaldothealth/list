#!/bin/bash
set -e
# Store current directory.
# We have to run docker compose from this directory for it to pick up the .env file.
pushd `dirname "$0"`
docker compose -f docker-compose.yml -f docker-compose.dev.full.yml up --build --force-recreate --renew-anon-volumes
# Restore directory.
popd
