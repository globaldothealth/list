# Full data pipeline

Ever wanted to not only convert *or* ingest the line-list data, but do both, together?

Have you ever wanted to import the freshest possible data directly into a
database?

This script is for you.

## Prerequisites

Install python dependencies:

```shell
python3 -m pip install -r requirements.txt
```

## How to run it

```shell
./convert_and_import_latest_data.sh [-m <mongodb_connection_string>] [-d <database>] [-c <collection>]
[-r <sample_rate>] [-s <schema_path>] [-i <indexes_path>]
```

NOTE: `mongodb_connection_string` should contain the database in the path.

It will default to running against your local MongoDB instance, the `covid19` database, the `cases` collection and
associated schema, with a sample rate of 1 (i.e. converting and importing all cases without sampling).