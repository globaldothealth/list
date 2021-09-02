# Database setup

This directory contains migrations to set up a MongoDB database to match the desired schema. MongoDB is actually schema-less; what this does is to update the indexes and validation rules.

## How to use

To run migrations (i.e. make your database match the expectations):

    export CONN=mongodb://localhost/covid19 # or your connection string
    export DB=covid19 # or your database name

    npm run migrate

To create a new migration (i.e. to change the expected state of the database):

    npm i -g migrate-mongo
    migrate-mongo create name-of-migration

That creates a file called `migrations/datetime-name-of-migration.js`. Edit the `up()` function to apply your change, and the `down()` function to disapply it. Now `npm run migrate` (or `dev/setup_db.sh` at the root level, if you're testing locally in Docker, will also work).
