# Working with ine-list data

This directory contains scripts for converting, ingesting, and otherwise munging line-list data.

## Converting line-list data

`convert_data.py` is a script to convert the line-list data from its original format, a CSV, to the new MongoDB schema-compliant json format.

```console
python3 convert_data.py --csv_path="latestdata.csv" [--json_path="cases.json"]
```