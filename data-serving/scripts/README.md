# Working with line-list data

This directory contains scripts for converting, ingesting, and otherwise munging line-list data.

## Converting line-list data

`convert_data.py` is a script to convert the line-list data from its original format, a CSV, to the new MongoDB schema-compliant json format.

```console
python3 convert_data.py --infile="latestdata.csv" [--outfile="cases.json"]
```

Logs will be written to `convert_data.log`.

### Current stats

- 99.7% of rows from the CSV file convert successfully to JSON
  + Of the 0.3% of rows with errors:
    - 99.6% have age values outside the valid range
    - 0.4% have invalid date formats
- 100% of rows from `cases.json` import successfully into mongodb using `cases.schema.json` as a validator

## What's included in the new schema?

### New fields

We are currently populating the following new (top-level) fields in the schema:

- Demographics
- Location
- Events
- Symptoms
- ChronicDisease
- Notes
- RevisionMetadata

The following fields are not yet populated:

- TravelHistory
- Source
- OutbreakSpecifics
- Pathogens

### Original fields

All nonempty fields from the original dataset are archived for posterity in the
new schema's importedCase field.

TBD whether those fields that are 100% losslessly converted will be removed from
this archive.