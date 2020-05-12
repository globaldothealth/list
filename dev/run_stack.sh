#!/bin/bash
set -e
# Store current directory.
pushd `pwd`
cd `dirname "$0"`
# We have to run docker-compose from the root directory for it to pick up the .env file.
docker-compose -f docker-compose.yml config
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
popd