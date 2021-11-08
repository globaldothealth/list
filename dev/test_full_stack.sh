#!/bin/bash
set -e

docker compose -f docker-compose.yml -f docker-compose.dev.full.test.yml up --build --force-recreate --renew-anon-volumes --exit-code-from test
