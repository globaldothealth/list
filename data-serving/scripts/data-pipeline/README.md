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

To use this script you will need to supply a sourceId as this is a required field in the mongo DB. You should create a mongo Source (either in the mongo shell or the Portal UI) with the URL set to https://github.com/globaldothealth/list#data, then grab the sourceId and add it to your command. The documentation link will be the main sourceURL for all of the cases and their actual source will be in additionalSources. This was done so that the table of automated ingestion sources is not cluttered with non-automated ingestion sources.

```shell
./convert_and_import_latest_data.sh [-m <mongodb_connection_string>] [-d <database>] [-c <collection>]
[-r <sample_rate>] [-s <schema_path>] [-i <indexes_path>] [-e <source_id>]
```

NOTE: `mongodb_connection_string` should contain the database in the path.

It will default to running against your local MongoDB instance, the `covid19` database, the `cases` collection and
associated schema, with a sample rate of 1 (i.e. converting and importing all cases without sampling).