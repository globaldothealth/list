#!/bin/bash
set -e
# Store current directory.
pushd `pwd`
# We have to run docker-compose from this directory for it to pick up the .env file.
cd `dirname "$0"`
docker-compose -f docker-compose.yml config
docker-compose -f docker-compose.yml up --build
# Restore directory.
popd