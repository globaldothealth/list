# Run this script from anywhere and pass it an email as first argument to make
# that user a super user with all roles assigned to it.
#!/bin/bash
set -e
# Store current directory.
pushd `pwd`
# We have to run docker-compose from this directory for it to pick up the .env file.
cd `dirname "$0"`

# Tell us what database to use — default is covid19 but you can override it for other instances
DB="${GDH_DATABASE:-covid19}"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec mongo mongo "${DB}" --eval "var email='$1'; var roles=['admin', 'curator'];" /verification/scripts/roles.js
# Restore directory.
popd