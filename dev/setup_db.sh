#!/bin/bash

CONN="${CONN:-mongodb://localhost/covid19}"

npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script migrate
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script drop-cases-and-import-sample-data