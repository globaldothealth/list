#!/bin/bash

DELETE_ALL_DOCUMENTS=true \
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ run-script setup-cases
npm --prefix=`dirname "$0"`/../data-serving/data-service/ run-script import-data