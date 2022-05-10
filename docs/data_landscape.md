# Data Landscape

What we have, and where it's stored. This is organised by somewhat-physical, somewhat-logical location.

## Databases

MongoDB Atlas stores line list case data (including revision history), user records, data ingestion source records including ingestion histories, maps of Mapbox administrative area codes to names and front-end session tokens for the line list portal. There are two projects:

 1. Covid19Map-Dev has one cluster, cluster-0, which is hosted in AWS us-east-1. It holds development data which is mostly based on historical snapshots of production.
 2. Covid19Map-Prod has one cluster, covid19-map-cluster01, also hosted in AWS us-east-1. It holds production data.

## S3 stores

Various buckets (data containers) are used for both temporary and long-term storage of G.h data. Unless otherwise noted, all S3 buckets are in eu-central-1.

### Unknown use

* config-bucket-612888738066 (contains logs relating to secrets management of the AWS Lambda infrastructure. This doesn't only relate to the old ADI implementation, so check whether this is still needed. In us-east-2)
* dev-vocviz-sample (old map code, probably not required, in us-east-2)
* ncov19 (us-east-1)

### Aggregates

Aggregated data from the line list used by the map visualisation.

* covid-19-aggregates
* covid-19-aggregates-dev

### Export

Country specific (country-) and full (data-) export files in various formats

* covid-19-country-export
* covid-19-country-export-dev
* covid-19-data-export
* covid-19-data-export-dev

### Map

Map is a static site exported to an S3 bucket

* dev-covid-19.global.health (only one of dev/dev-map is used, in us-east-2)
* dev-map.covid-19.global.health
* map.covid-19.global.health
* dev-react-map.covid-19.global.health (us-east-2, should move to dev-map)
* react-map.covid-19.global.health (should move to map.covid-19.global.health)
* qa-covid-19.global.health

### Ingestion

* gdh-credentials (used to authenticate against backend, should move to API keys)
* gdh-sources (raw files downloaded from source URLs, was epid-ingestion-raw)

### Miscellaneous

* gdh-terraform-state-main (terraform state for our stack)
* gdh-metrics (telemetry on UI and Map)
* h1n1.global.health (us-east-2, H1N1 map)

## Application logs

All of the "backend" components log to CloudWatch log streams in us-east-1 with no automatic rotation or expiration.

## Computing servers

The kubernetes cluster (i.e. the backend services for the line list app) runs on four EC2 instances in us-east-1. No application data is stored here.

Ingestion and export both run on AWS Batch "serverless" architecture, both in us-east-1. No application data is stored here.

Data export has until recently run on AWS Lambda, again no application data is stored here. This is on its way out but mentioned for completeness.

## Anything else?

 - source code and issue reports are stored in github, hosted in their own U.S. data centers. Some non-line-list data, e.g. list of countries, is stored here.
 - project discussions happen on Slack, in a Pro plan workspace (so no defined data residency, assume US)
