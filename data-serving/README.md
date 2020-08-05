
# All things data

## Case schema updates
### What needs to be changed & where

Schema updates can affect the whole stack, including:

* The
  **[MongoDB case json schema](https://github.com/globaldothealth/list/blob/ca177c1b9a940dcd0f51166db6c6f13976894dda/data-serving/data-service/schemas/cases.schema.json)**,
  which is a 'validator' applied to the cases collection on the database. This schema is similar to a relational
  database schema in that it enforces which fields are allowed to be present and what their types are. It does not
  validate any values. This validator will apply to all case data regardless of how it's entered into the database.
* The
  **[Mongoose schema/data model in the dataserver](https://github.com/globaldothealth/list/tree/175bbdd66e0cc02a87629969b70658783fe75518/data-serving/data-service/src/model)**,
  which in addition to mirroring the mongodb json schema also has some additional validation logic (what fields are
  required, regexes, etc). The reason this is more stringent than the mongodb json schema is that not all data in the
  database is expected to conform to our expectations of _new_ data, the latter of which has to go through the mongoose
  schema — ex. imports from the existing CSV may not have all the data that we've made required through the curator
  portal.
* The **OpenAPI specs**, which, in addition to providing API documentation, validates requests and responses. For the
  most part, our API case object mirrors the mongodb case object, so changes to the schema will, unless intentionally
  accounted for in the dataserver, also affect the API.
    * [Dataserver OpenAPI spec](https://github.com/globaldothealth/list/blob/b31c502939ada1303d82aa499425c9f90ec1a213/data-serving/data-service/api/openapi.yaml)
    * [Curator API server OpenAPI spec](https://github.com/globaldothealth/list/blob/d487a761707ccb63c80e1f7248e6667509c2da51/verification/curator-service/api/openapi/openapi.yaml)
* The
  **[curator UI](https://github.com/globaldothealth/list/tree/175bbdd66e0cc02a87629969b70658783fe75518/verification/curator-service/ui/src/components)**,
  which sends and receives case objects via the aforementioned curator API. So again, if something changes in the API,
  it will affect the model objects used in the UI.
* The
  **[CSV → json converter](https://github.com/globaldothealth/list/blob/175bbdd66e0cc02a87629969b70658783fe75518/data-serving/scripts/convert-data/convert_data.py)**,
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
    * [Seeding local databases](https://github.com/globaldothealth/list/tree/e85dacd056db71e1d7d4b56034536ccc6dbee23c/data-serving/samples)
    * [Dataserver unit test fixtures](https://github.com/globaldothealth/list/tree/e85dacd056db71e1d7d4b56034536ccc6dbee23c/data-serving/data-service/test/model/data)
    * Integration test fixtures
      [[1](https://github.com/globaldothealth/list/blob/224abab6189af6e5a0ad26ae082167c2a3f5966a/verification/curator-service/ui/cypress/support/commands.ts)],
      [[2](https://github.com/globaldothealth/list/blob/ca177c1b9a940dcd0f51166db6c6f13976894dda/verification/curator-service/ui/src/components/fixtures/fullCase.json)]

#### Sample PRs

* [Adding a field to the schema](https://github.com/globaldothealth/list/pull/318/files)
* [Modify/rename a field](https://github.com/globaldothealth/list/pull/372/files)
* [Remove a field](https://github.com/globaldothealth/list/pull/257/files)

### Testing a schema update

1. First, make the changes to the affected parts of the stack, including sample data and test fixtures.
1. Run
   [dev/setup\_db.sh](https://github.com/globaldothealth/list/blob/ca177c1b9a940dcd0f51166db6c6f13976894dda/dev/setup_db.sh)
   and check the output for errors. If one or more documents fails to import, there may be a mismatch between your
   [sample data](https://github.com/globaldothealth/list/tree/e85dacd056db71e1d7d4b56034536ccc6dbee23c/data-serving/samples)
   and your
   [MongoDB json schema](https://github.com/globaldothealth/list/blob/ca177c1b9a940dcd0f51166db6c6f13976894dda/data-serving/data-service/schemas/cases.schema.json).

   `./dev/setup\_db.sh`

1. Run the CSV → JSON importer locally and check the output for errors. If one or more documents fails to import, there
   may be a mismatch between the data the
   [converter](https://github.com/globaldothealth/list/blob/175bbdd66e0cc02a87629969b70658783fe75518/data-serving/scripts/convert-data/convert_data.py)
   outputs and your
   [MongoDB json schema](https://github.com/globaldothealth/list/blob/ca177c1b9a940dcd0f51166db6c6f13976894dda/data-serving/data-service/schemas/cases.schema.json).

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

### Adding an index

1. Add your index to the
   [schemas directory](https://github.com/globaldothealth/list/tree/ea2c63cac1ed1190d6a1eb28f15fe17a80e88c67/data-serving/data-service/schemas)
1. Update the
   [database update script](https://github.com/globaldothealth/list/blob/ea2c63cac1ed1190d6a1eb28f15fe17a80e88c67/data-serving/scripts/setup-db/src/index.ts)
   to ensure it's applied to the database

#### Sample PRs

* [Adding a new compound index](https://github.com/globaldothealth/list/pull/701/files)