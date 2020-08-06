# Export data

This script is a thin wrapper around `mongoexport` to help export data to either csv or json files. It abstracts away
some of `mongoexport`'s format-dependent inconsistencies and uses reasonable defaults for our project.

## How to run it

```shell
./export_data.sh [-m <mongodb_connection_string>] [-c <collection>] [-o <csv|json>] [-f <fields_filepath>]
```

Notes:
- `mongodb_connection_string` should contain the database in the path.
- `field_filepath` points to a file containing a new-line separated list of fields to be included in the export.
- The script will default to running against your local MongoDB instance, the `covid19` database, the `cases`
  collection, `csv` format, and a fields file containing the full complement of fields in the `case` schema.