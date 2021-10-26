# Aggregating data

This is a AWS SAM application built to aggregate data that is used by Map.
Previously Lambda functions were used for data export, that is now handled
by AWS Batch in [../export-data](../export-data/README.md)

Deployment of export scripts using [sam deploy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html) is done automatically on pushes to -stable branches using a [GitHub Action](https://github.com/globaldothealth/list/blob/main/.github/workflows/aggregate-deploy.yaml). If you have added or removed permissions for the Lambda functions in the template.yaml, automatic deployment may fail; alter the permissions for the GitHub Actions user in AWS IAM accordingly (ideally by creating a new policy for this access).

The aggregation scripteries MongoDB for aggregate counts at Regional, Country, and Total levels.

**Note for Country level**: Mapbox requires that the lat/long coordinates remain static in order to return the shapes for the choropleth, so this is standardized using the [Google Canonical DSPL countries.csv](https://developers.google.com/public-data/docs/canonical/countries_csv) dataset.
