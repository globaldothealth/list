# Run this script from anywhere and pass it an email as first argument to make
# that user a super user with all roles assigned to it.
#!/bin/bash
set -e
# Store current directory.
pushd `pwd`
# We have to run docker-compose from this directory for it to pick up the .env file.
cd `dirname "$0"`
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec mongo mongo covid19 --eval "var email='$1'; var roles=['admin', 'curator', 'reader'];" /verification/scripts/roles.js
# Restore directory.
popd