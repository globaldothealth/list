# Data Landscape

What we have, and where it's stored. This is organised by somewhat-physical, somewhat-logical location.

## Databases

MongoDB Atlas stores line list case data (including revision history), user records, data ingestion source records including ingestion histories, maps of Mapbox administrative area codes to names and front-end session tokens for the line list portal. There are two projects:

 1. Covid19Map-Dev has one cluster, cluster-0, which is hosted in AWS us-east-1. It holds development data which is mostly based on historical snapshots of production.
 2. Covid19Map-Prod has one cluster, covid19-map-cluster01, also hosted in AWS us-east-1. It holds production data.

## S3 stores

Various buckets (data containers) are used for both temporary and long-term storage of G.h data.

 - `amplify-curatorui-*`:  unused deployments of a component that global.health does not rely on and can (and should!) be deleted. They are in us-east-2.
 - `archive-epid-sources-raw`:  contains copies of upstream data for ingestion that were processed by the old AWS Lambda implementation of ADI. They can (and should!) be deleted. They are in us-east-1.
 - `aws-sam-cli-exportdatasourcebucket`:  is empty.
 - `aws-sam-cli-managed-default-samclisourcebucket-1txyh416iht6x`:  contains templates and images for the old AWS Lambda implementation of ADI. It can (and should!) be deleted. It is in us-east-1.
 - `aws.healthmap.org`: the deployment of the healthmap website. It isn't part of Global.health. It's in us-east-2.
 - `config-bucket-612888738066`: contains logs relating to secrets management of the AWS Lambda infrastructure. This doesn't only relate to the old ADI implementation, so check whether this is still needed. It's in us-east-2.
 - `covid-19-aggregates`: aggregated data from the line list used by the map visualisation. In us-east-1. Check whether historical copies of data are still needed.
 - `covid-19-cache`: empty.
 - `covid-19-country-export`: per-country exports of the line list to support downloads. In us-east-1.
 - `covid-19-data-export`: exports of the whole line list data for downloads. Check whether we need to keep the historical versions. In us-east-1.
 - `covid-19.global.health`: the deployment of the top-level covid-19 website. In us-east-2.
 - `covid-19-filtered-downloads`: empty.
 - `dev-covid-19.global.health`, `dev-map.covid-19.global.health` and `dev-vocviz-sample`: all internal deployments of parts of the website. All in us-east-2.
 - `epid-ingestion`: contains details for a google service account. In us-east-1.
 - `epid-sources-raw`: copies of upstream data for ingestion by the new AWS Batch implementation of ADI. Should have a data retention policy defined and implemented. In us-east-1.
 - `gh-metrics-report-bucket`: summary statistics on user activity. In us-east-1.
 - `global-dot-health-data-export-bucket` and `global-dot-health-data-export-bucket-2`: historical copies of CSV exports of the line list to support downloads. Check whether we need to keep the historical versions. In us-east-1.
 - `h1n1.global.health`: the deployment of the h1n1 outbreak map. In us-east-2.
 - `map.covid-19.global.health`: the deployment of the covid-19 outbreak map. In us-east-2.
 - `ncov19`: the last export of the beoutbreakprepared data from September 2020. In us-east-1.

## Application logs

All of the "backend" components log to CloudWatch log streams in us-east-1 with no automatic rotation or expiration.

## Computing servers

The kubernetes cluster (i.e. the backend services for the line list app) runs on four EC2 instances in us-east-1. No application data is stored here.

Ingestion and export both run on AWS Batch "serverless" architecture, both in us-east-1. No application data is stored here.

Data export has until recently run on AWS Lambda, again no application data is stored here. This is on its way out but mentioned for completeness.

## Anything else?

 - source code and issue reports are stored in github, hosted in their own U.S. data centers. Some non-line-list data, e.g. list of countries, is stored here.
 - project discussions happen on Slack, in a Pro plan workspace (so no defined data residency, assume US)
