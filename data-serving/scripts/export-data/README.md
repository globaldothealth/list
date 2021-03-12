# Exporting Data

## What you will find here

This is a AWS SAM application built to orchestrate everything around exporting and formatting data for use outside of MongoDB Atlas and the Data page.

Functions 1-4 handle the export process for the total data download.

Function 5 handles the aggregated data export for the Map visualizations.

## Total Data Export

- **[01-split](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/export-data/functions/01-split)** Determines how many chunks are needed and invokes exporting each chunk by sending indices to parallel executions of **02-export**.
- **[02-export](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/export-data/functions/02-export)** Is a lightweight wrapper for [mongoexport](). If you need to add new columns, the `fields.txt` file is one of the first things you will need to change. Data is stored on an EFS instance at the end of this step.
- **[03-parse](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/export-data/functions/03-parse)** Performs transformations for flattening data nested in arrays. This is very similar to the parsers used in the ingestion process. Processed files are stored in S3.
- **[04-combine](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/export-data/functions/04-combine)** Checks to see whether all processed chunks are available on S3. If yes, downloads them all, combines them, and uploads to production. The data dictionary and acknowledgements are added here.

## Map Aggregate Export

- **[05-aggregate](https://github.com/globaldothealth/list/tree/main/data-serving/scripts/export-data/functions/05-aggregate)** Queries MongoDB for aggregate counts at Regional, Country, and Total levels.

### Note for Country level

Mapbox requires that the lat/long coordinates remain static in order to return the shapes for the choropleth, so this is standardized using the [Google Canonical DSPL countries.csv](https://developers.google.com/public-data/docs/canonical/countries_csv) dataset.

## Thoughts for Future

1. Some of these functions may need to be either rethought or swapped for AWS Batch as data grows.
2. Extending functions 1-4 might be a good place to start for the filtered exports.
3. Automating the updating of the data dictionary to always match the download format would be a nice feature.
