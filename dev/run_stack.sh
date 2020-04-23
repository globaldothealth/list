#!/bin/bash
set -e
docker-compose -f `dirname "$0"`/docker-compose.yml -f `dirname "$0"`/docker-compose.dev.yml up --build