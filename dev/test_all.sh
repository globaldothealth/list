#!/bin/bash
set -e
npm --prefix=../verification/curator-service/api/ run-script test-silent
npm --prefix=../data-serving/data-service/ run-script test-silent
npm --prefix=../verification/curator-service/ui/ run-script test-silent