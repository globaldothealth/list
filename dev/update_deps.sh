#!/bin/bash
set -e
npm --prefix=`dirname "$0"`/../verification/curator-service/api/ update
npm --prefix=`dirname "$0"`/../data-serving/data-service/ update
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ update
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ update