#!/bin/bash
set -e

trap "trap - SIGTERM && kill 0" SIGINT SIGTERM EXIT

not_directory() {
  if [ -d "$1" ]; then
    false
  fi
}

install_dependencies() {
  if not_directory `dirname "$0"`"$1"/node_modules; then
    echo "Missing dependencies in $0$1, installing now..."
    npm --prefix=`dirname "$0"`"$1" install
  fi
}

echo "Running geocoding service API tests"
pushd `dirname "$0"`/../geocoding/location-service
poetry install
poetry update
./run_tests.sh
popd

install_dependencies /../verification/curator-service/api/
echo "Running curator service API tests"
npm --prefix=`dirname "$0"`/../verification/curator-service/api/ run-script test-silent
install_dependencies /../data-serving/data-service/
echo "Running data service API tests"
npm --prefix=`dirname "$0"`/../data-serving/data-service/ run-script test-silent
install_dependencies /../verification/curator-service/ui/
echo "Running curator service UI tests"
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ run-script test-silent

RUNNING=$(curl localhost:3002 --silent | grep "DOCTYPE" || true)
if [ -z "$RUNNING" ]; then
  echo "Starting stack..."
  nohup ./run_full_stack.sh | tee &
fi

until $(curl localhost:3002 --silent --fail | grep "DOCTYPE" > /dev/null); do
  echo "Waiting 5 more seconds for curator UI"
  sleep 5
done

echo "Stack running"

echo "Running UI browser tests"
npm --prefix=`dirname "$0"`/../verification/curator-service/ui/ run-script cypress-run
