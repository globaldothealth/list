# Working with line-list data

This directory contains scripts for converting, ingesting, and otherwise munging line-list data.

## Converting line-list data

`convert_data.py` is a script to convert the line-list data from its original format, a CSV, to the new MongoDB schema-compliant json format.

```console
python3 convert_data.py --infile="latestdata.csv" [--outfile="cases.json"]
```

Logs will be written to `convert_data.log`.

## What's included in the converted data?

### New fields

We are currently populating the following new (top-level) fields in the schema:

- Demographics
- Location
- Events
- Symptoms
- ChronicDisease

The following fields are not yet populated:

- TravelHistory
- Source
- OutbreakSpecifics
- Pathogens
- Notes
- RevisionMetadata

### Original fields

All nonempty fields from the original dataset are archived for posterity in the
new schema's importedCase field.

TBD whether those fields that are 100% losslessly converted will be removed from
this archive.