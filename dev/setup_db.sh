#!/bin/bash

export CONN="mongodb://localhost/covid19"
export DB="covid19"

npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script migrate
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script delete-all-cases
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script import-sample-data