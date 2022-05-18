# Data Landscape

What we have, and where it's stored. This is organised by somewhat-physical, somewhat-logical location.

## Databases

MongoDB Atlas stores line list case data (including revision history), user records, data ingestion source records including ingestion histories, maps of Mapbox administrative area codes to names and front-end session tokens for the line list portal. There are two projects:

 1. Covid19Map-Dev has one cluster, cluster-0, which is hosted in AWS eu-central-1. It holds development data which is mostly based on historical snapshots of production.
 2. Covid19Map-Prod has one cluster, covid19-map-cluster01, also hosted in AWS eu-central-1. It holds production data.

## S3 stores

Various buckets (data containers) are used for both temporary and long-term storage of G.h data. All S3 buckets except the one storing terraform state are in eu-central-1.

## Application logs

All of the "backend" components log to CloudWatch log streams in eu-central-1 with no automatic rotation or expiration.

## Computing servers

The kubernetes cluster (i.e. the backend services for the line list app) runs on Fargate in eu-central-1. No application data is stored here.

Ingestion and export both run on AWS Batch in eu-central-1. No application data is stored here.

## Anything else?

 - source code and issue reports are stored in github, hosted in their own U.S. data centers. Some non-line-list data, e.g. list of countries, is stored here.
 - project discussions happen on Slack, in a Pro plan workspace (so no defined data residency, assume US)
