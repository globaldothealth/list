# Aggregating data

This is a AWS batch script built to aggregate data that is used by COVID-19 Map.
Previously Lambda functions were used for data export, that is now handled
by AWS Batch in [../export-data](../export-data/README.md)

The Batch job (actually two; one for the [dev map](https://dev-map.covid-19.global.health) and one for [prod](https://map.covid-19.global.health)) pulls the code from an image on the Amazon container repo. That image is prepared from the `main` branch by a github action.

**Note for Country level**: Mapbox requires that the lat/long coordinates remain static in order to return the shapes for the choropleth, so this is standardized using the [Google Canonical DSPL countries.csv](https://developers.google.com/public-data/docs/canonical/countries_csv) dataset.

### COVID-19 specific aggregation

This script is only appropriate for aggregating COVID-19 data, as it merges in information from the John Hopkins University to report on completeness.
