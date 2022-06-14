#!/bin/bash

export DB="${DB:-covid19}"

npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script migrate
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script delete-all-cases
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script import-sample-data