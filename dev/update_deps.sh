#!/bin/bash
set -e

echo 'Pruning dependencies. 🪓'
npm --prefix=`dirname "$0"`/../verification/curator-service/api/ prune
npm --prefix=`dirname "$0"`/../data-serving/data-service/ prune
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ prune
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ prune

echo 'Updating dependencies. ⬆'
npm --prefix=`dirname "$0"`/../verification/curator-service/api/ update
npm --prefix=`dirname "$0"`/../data-serving/data-service/ update
npm --prefix=`dirname "$0"`/../data-serving/scripts/setup-db/ update
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ update