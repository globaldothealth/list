#!/bin/bash
set -e
npm --prefix=`dirname "$0"`/../verification/curator-service/api/ run-script test-silent
npm --prefix=`dirname "$0"`/../data-serving/data-service/ run-script test-silent
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ run-script test-silent
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ run-script cypress-ci-test