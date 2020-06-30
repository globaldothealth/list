# Database setup

This directory contains a script to set up a fresh MongoDB collection.

## What does it do?

1. Gets or creates the database;
2. Drops the collection, if it already exists;
3. (Re-)creates the collection with the schema applied;
4. TODO: Creates indexes.

## Run it!

To run it with the defaults -- i.e. against localhost, no authentication, using
the default database (`covid19`) and collection (`cases`), run:

`npm run setup-cases`

To run it with configurable options, e.g. a different connection string, run:

`CONN="some_conn_string" DB="some_db" COLL="some_collection" SCHEMA="../some/schema/path.json" INDEX="../some/index/path" npm run setup`

For example, the below invocation of `setup` would give you the same result as
`setup-cases`:

`CONN="mongodb://127.0.0.1:27017" DB="covid19" COLL="cases" SCHEMA="./../../data-service/schemas/cases.schema.json" INDEX="./../../data-service/schemas/cases.index.json" npm run setup`