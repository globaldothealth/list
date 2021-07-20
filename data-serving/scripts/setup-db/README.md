# Database setup

This directory contains a script to set up a fresh MongoDB collection.

## What does it do?

1. Gets or creates the database;
2. If the collection exists, deletes imported docs* from the collection and
   applies the latest schema; if it doesn't exist yet, creates the collection
   with the latest schema.
3. Creates indexes.

*Imported documents are the ones with an `importedCase` property. They come from
the legacy Google Sheets system, not the new G.H portal.

## Run it!

To run it with the defaults -- i.e. against localhost, no authentication, using
the default database (`covid19`) and collection (`cases`), run:

`npm run setup-cases`

You also need to set up the `restrictedcases` collection, for storing data that
cannot appear in the line list:

`npm run setup-restricted-cases`

To run it with configurable options, e.g. a different connection string, or the
option to delete all documents, run:

`CONN="some_conn_string" DB="some_db" COLL="some_collection" SCHEMA="../some/schema/path.json" INDEXES="../some/index/path" DELETE_ALL_DOCUMENTS=true|false npm run setup`

For example, the below invocation of `setup` would give you the same result as
`setup-cases`:

`CONN="mongodb://127.0.0.1:27017" DB="covid19" COLL="cases" SCHEMA="./../../data-service/schemas/cases.schema.json" INDEXES="./../../data-service/schemas/cases.indexes.json" npm run setup`