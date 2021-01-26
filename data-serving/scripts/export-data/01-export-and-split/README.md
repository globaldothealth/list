# Export data

This script is a thin wrapper around `mongoexport` to help export data to either csv or json files. It abstracts away
some of `mongoexport`'s format-dependent inconsistencies and uses reasonable defaults for our project.

## Export data dictionary

The dictionary can be found in this same directory in the case_fields.yaml file.
This file contains all the fields exported from Mongo DB and their associated description to be sure that they are kept in sync.

## How to run it

You'll need Python3 (tested on 3.8 but any version 3+ should work really) and pyyaml installed:

```shell
pip3 install -r requirements.txt
```

Then you can run the script:

```shell
python3 export.py -h
usage: export.py [-h] [--mongodb_connection_string MONGODB_CONNECTION_STRING] [--collection COLLECTION] [--fields FIELDS]
                 [--format {csv,json}]

Exports MongoDB data to a csv or json file

optional arguments:
  -h, --help            show this help message and exit
  --mongodb_connection_string MONGODB_CONNECTION_STRING
  --collection COLLECTION
  --fields FIELDS       YAML file containing the case fields to export and their definition
  --format {csv,json}, -f {csv,json}
```

Notes:
- `mongodb_connection_string` should contain the database in the path.
- `fields` points to a YAML file containing the list of fields and their associated description to be used as a data dictionary by consumers of the exported data.
- The script will default to running against your local MongoDB instance, the `covid19` database, the `cases`
  collection, `csv` format, and a fields file containing the full complement of fields in the `case` schema.
  