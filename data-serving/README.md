# All things data

## Database design

G.h case data, as well as the source, user, and session data for the curator portal, is stored in a MongoDB database.

We have multiple instances of MongoDB, ranging from local instances for development, to dev (for
http://dev-curator.ghdsi.org/), to prod (for http://curator.ghdsi.org/).

Each instance has a `covid19` database, which in turn has collections for each type of data, e.g. `cases`, `users`, etc.

## Case data

The data in the `cases` collection is the primary data that G.h collects, verifies, and shares. Each document in the
`cases` collection represents a single COVID-19 case.

### Shape of the data

To learn more about what a `case` consists of, try
[importing](https://github.com/globaldothealth/list/blob/main/dev/setup_db.sh) some
[sample data](https://github.com/globaldothealth/list/tree/main/data-serving/samples) into a local MongoDB instance and
connecting to it with [MongoDB Compass](https://www.mongodb.com/products/compass). Alternatively, you can peruse the
[schema](https://github.com/globaldothealth/list/blob/main/data-serving/data-service/schemas/cases.schema.json).

### Version history

We store past revisions of `case` documents in the `caserevisions` collection. These revisions are made in the
application layer when a case is updated; we follow the
[MongoDB Document Version Pattern](https://www.mongodb.com/blog/post/building-with-patterns-the-document-versioning-pattern).

A `caserevision` document has a `case` field containing a snapshot of the `case` at a given revision. The collection
indexes the id of the `case` and its revision for quick lookups.

### Charts

We use MongoDB to generate charts that surfaced in the curator portal. These are available through the prod MongoDB
Atlas instance.

- [Cumulative dataset metrics](https://charts.mongodb.com/charts-covid19map-prod-dznzw/dashboards/b897bb76-e761-49b4-b106-7e97c54aeca8)
- [Dataset freshness metrics](https://charts.mongodb.com/charts-covid19map-prod-dznzw/dashboards/393c3fa3-27b2-483b-9e5e-88ae5229bbad)
- [Dataset completeness metrics](https://charts.mongodb.com/charts-covid19map-prod-dznzw/dashboards/15306e1e-efed-427b-928a-753b70f971aa)

### Importing cases

G.h has millions of case records that predate the new curator portal. These are exported to a
[gzipped CSV](https://github.com/beoutbreakprepared/nCoV2019/tree/master/latest_data) in a
[separate repo](https://github.com/beoutbreakprepared/nCoV2019).

We can convert these cases to a json format that conforms to the `cases` collection schema and ingest these into a
MongoDB instance using these scripts:
1. [Convert the data only](https://github.com/globaldothealth/list/tree/main/database/convert-data)

#### FIXME: this does not exist
1. [Convert & ingest the data into MongoDB](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/data-pipeline)

As of writing, there is a
[Github workflow to automate this conversion & import once a day to the prod MongoDB instance](https://github.com/globaldothealth/list/blob/main/.github/workflows/case-data-update-prod.yml);
however, this is likely to be disabled and future imports will be done selectively.

### Exporting data

We provide a flattened version of the complete dataset accessible through the Data page, refreshed on a nightly basis and stored on S3. [The scripts that orchestrate this](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/export-data) are organized using AWS SAM, and export the dataset in chunks in parallel, parse them, recombine them and then compress and upload the result along with a data dictionary.

The script that aggregates and exports counts for the Map visualizations may also be found in this set of scripts.

### Updating the case schema
#### What needs to be changed & where

Schema updates can affect the whole stack, including:

* The
  **[MongoDB case json schema](https://github.com/globaldothealth/list/blob/main/data-serving/data-service/schemas/cases.schema.json)**,
  which is a 'validator' applied to the cases collection on the database. This schema is similar to a relational
  database schema in that it enforces which fields are allowed to be present and what their types are. It does not
  validate any values. This validator will apply to all case data regardless of how it's entered into the database.
* The
  **[Mongoose schema/data model in the dataserver](https://github.com/globaldothealth/list/blob/main/data-serving/data-service/src/model)**,
  which in addition to mirroring the mongodb json schema also has some additional validation logic (what fields are
  required, regexes, etc). The reason this is more stringent than the mongodb json schema is that not all data in the
  database is expected to conform to our expectations of _new_ data, the latter of which has to go through the mongoose
  schema — ex. imports from the existing CSV may not have all the data that we've made required through the curator
  portal.
* The **OpenAPI specs**, which, in addition to providing API documentation, validates requests and responses. For the
  most part, our API case object mirrors the mongodb case object, so changes to the schema will, unless intentionally
  accounted for in the dataserver, also affect the API.
    * [Dataserver OpenAPI spec](https://github.com/globaldothealth/list/blob/main/data-serving/data-service/api/openapi.yaml)
    * [Curator API server OpenAPI spec](https://github.com/globaldothealth/list/blob/main/verification/curator-service/api/openapi/openapi.yaml)
* The
  **[curator UI](https://github.com/globaldothealth/list/tree/main/verification/curator-service/ui/src/components)**,
  which sends and receives case objects via the aforementioned curator API. So again, if something changes in the API,
  it will affect the model objects used in the UI.
* The
  **[CSV → json converter](https://github.com/globaldothealth/list/blob/main/data-serving/scripts/convert-data/convert_data.py)**,
  which converts the existing (Sheets-originated) CSV data to json that conforms to the aforementioned MongoDB schema.
  If you add a _new_ field to the case schema that is not present in the old data, you don't need to worry about this;
  however, if you're modifying a field that is part of the conversion process, the converter will need to be updated to
  generate the correct fields/data.
* The **mongodb → CSV exporter**, which exports specified fields from the MongoDB cases into a CSV format that we can
  make available to researchers, similar to the CSV that was generated from Google Sheets originally. If you add,
  remove, or rename a field and it's part of (or should be added to) the CSV export, you'll need to update the exporter.
  [TBD/WIP]
* The **sample data**, which unfortunately is sprinkled throughout the stack, and is used for seeding local databases
  and for unit & integration testing. The examples need to be updated with the changes.
    * [Seeding local databases](https://github.com/globaldothealth/list/tree/main/data-serving/samples)
    * [Dataserver unit test fixtures](https://github.com/globaldothealth/list/tree/main/data-serving/data-service/test/model/data)
    * Integration test fixtures
      [[1](https://github.com/globaldothealth/list/blob/main/verification/curator-service/ui/cypress/support/commands.ts)],
      [[2](https://github.com/globaldothealth/list/blob/main/verification/curator-service/ui/src/components/fixtures/fullCase.json)]

##### Sample PRs

* [Adding a field to the schema](https://github.com/globaldothealth/list/pull/318/files)
* [Modify/rename a field](https://github.com/globaldothealth/list/pull/372/files)
* [Remove a field](https://github.com/globaldothealth/list/pull/257/files)

#### Testing a schema update

1. First, make the changes to the affected parts of the stack, including sample data and test fixtures.
1. Run
   [dev/setup\_db.sh](https://github.com/globaldothealth/list/blob/main/dev/setup_db.sh)
   and check the output for errors. If one or more documents fails to import, there may be a mismatch between your
   [sample data](https://github.com/globaldothealth/list/tree/main/data-serving/samples)
   and your
   [MongoDB json schema](https://github.com/globaldothealth/list/blob/main/data-serving/data-service/schemas/cases.schema.json).

   `./dev/setup\_db.sh`

1. Run the CSV → JSON importer locally and check the output for errors. If one or more documents fails to import, there
   may be a mismatch between the data the
   [converter](https://github.com/globaldothealth/list/blob/main/data-serving/scripts/convert-data/convert_data.py)
   outputs and your
   [MongoDB json schema](https://github.com/globaldothealth/list/blob/main/data-serving/data-service/schemas/cases.schema.json).

   ```
   cd data-serving/scripts/data-pipeline
   python3 -m pip install -r requirements.txt
   ./convert\_and\_import\_latest\_data.sh -r .01</td>
   ```

1. Run the dataservice unit tests. If one of the model tests fails, there may be a mismatch between your test fixtures
   and the Mongoose schema/data model; if one of the controller tests fails, there may be a mismatch between your test
   fixtures and the OpenAPI spec.

   ```
   cd data-serving/data-service
   npm run test
   ```

1. Run the curator API unit tests. If one of the controller tests fails, there may be a mismatch between the dataservice
   OpenAPI spec and the curator service OpenAPI spec.

   ```
   cd verification/curator-service/api
   npm run test
   ```

1. Run the integration tests. If one of the tests fails, there may be a mismatch between the curator OpenAPI spec and
   the curator UI.

   `./dev/test_all.sh`

1. Run the exporter locally. If it fails, there may be a mismatch between the MongoDB json schema and the exporter
   script. [TBD/WIP]

#### Adding an index

1. Add your index to the
   [schemas directory](https://github.com/globaldothealth/list/tree/main/data-serving/data-service/schemas)
1. Update the
   [database update script](https://github.com/globaldothealth/list/blob/main/data-serving/scripts/setup-db/src/index.ts)
   to ensure it's applied to the database

##### Sample PRs

* [Adding a new compound index](https://github.com/globaldothealth/list/pull/701/files)

## Extending to new outbreaks

Our database design is intended to be flexible enough to support future outbreaks. To spin up an instance of the curator
service with a different dataset, create a new database in your MongoDB instance and
[point the curator portal to it](https://github.com/globaldothealth/list/blob/main/dev/docker-compose.yml).