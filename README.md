# Global.health List

[Global.health](https://global.health)'s mission is to enable rapid sharing of trusted and open public health data to
advance the response to infectious diseases.

This repository contains the servers and scripts that support its data curation efforts.

Should you have any questions please feel free to get in touch via: info@global.health

## Data

The data exposed on Global.health was curated using two methods. ~60,000 cases were manually curated by humans analyzing sources and inputting data into spreadsheets. This data was ported from the spreadsheets into the Curator Portal as described [here](https://github.com/globaldothealth/list/blob/main/data-serving/scripts/convert-data#converting-line-list-data). The rest of the data was automatically ingested from sources through a process described [here](https://github.com/globaldothealth/list/tree/main/ingestion/functions#ingestion-functions). Each case is marked as `VERIFIED` if a human has confirmed this data is valid or `UNVERIFIED` if it has not yet been reviewed.

You can tell if a case was imported from the manually created spreadsheets data in a couple of ways. The case will be marked as created by covid19_spreadsheets@googlegroups.com. It will also have a source URL that links to this documentation. The source URL that was used to find data about these cases can be found in the additional sources section of the detailed case view (found by clicking on the table row).

## Frontends

- [dev](https://dev-data.covid-19.global.health)
- [prod](https://data.covid-19.global.health)

## Daily exports of case data

A daily export of case data can be downloaded from the data portal. The data
is generated using this [script](data-serving/scripts/export-data/README.md), with
this [data dictionary](data-serving/scripts/export-data/functions/01-split/fields.txt).

## CI/CD status

* [**All actions**](https://github.com/globaldothealth/list/actions)

* **Docker images**

   ![Curator Service Github Packages Push](https://github.com/globaldothealth/list/workflows/Curator%20Service%20Github%20Packages%20Push/badge.svg)

   ![Data Service Github Packages Push](https://github.com/globaldothealth/list/workflows/Data%20Service%20Github%20Packages%20Push/badge.svg)

   ![Geocoding Service Github Packages Push](https://github.com/globaldothealth/list/actions/workflows/geocoding-service-package.yml/badge.svg)

   ![Ingestion functions deploy](https://github.com/globaldothealth/list/actions/workflows/ingestion-functions-deploy.yml/badge.svg)

* **Tests**

   ![Geocoding location-service Python CI](https://github.com/globaldothealth/list/actions/workflows/geocoding-service-python.yml/badge.svg)

   ![Integration Tests CI](https://github.com/globaldothealth/list/workflows/Integration%20Tests%20CI/badge.svg)

   ![Ingestion functions Python CI](https://github.com/globaldothealth/list/workflows/Ingestion%20functions%20Python%20CI/badge.svg)

   ![Data service Node.js CI](https://github.com/globaldothealth/list/workflows/Data%20service%20Node.js%20CI/badge.svg)

   ![Curator UI Node.js CI](https://github.com/globaldothealth/list/workflows/Curator%20UI%20Node.js%20CI/badge.svg)

   ![Curator API Node.js CI](https://github.com/globaldothealth/list/workflows/Curator%20API%20Node.js%20CI/badge.svg)

   ![Suggest python scripts](https://github.com/globaldothealth/list/workflows/Suggest%20python%20scripts/badge.svg)

* **Monitoring**

   ![Data monitoring notifications](https://github.com/globaldothealth/list/actions/workflows/monitoring-notify.yml/badge.svg)


## Components

- [The data service](data-serving/data-service) in `data-serving/data-service` facilitates CRUD operations with the
  MongoDB database storing case data.
- [The curator service](verification/curator-service/api) in `verification/curator-service/api` serves as the backend
  for the curator portal, which enables curators to view, enter, update, and verify cases; manage data sources and their
  ingestion; and manage portal access.
- [The geocoding service](geocoding/location-service) geocodes locations and is
  used by the data service, but can be used standalone as well.
- [The curator UI](verification/curator-service/ui) in `verification/curator-service/ui` is the frontend for the curator
  portal.

## Developer documentation

### READMEs

- Getting set up
  - [Local development](dev/README.md)
  - [Production infrastructure set-up and management](aws/README.md)
- Component documentation
  - [Authentication & authorization](verification/curator-service/auth.md)
  - [Data ingestion functions](ingestion/functions/README.md)
  - [Curator service](verification/curator-service/api/README.md)
  - [Curator UI](verification/curator-service/ui/README.md)
  - [Data service](data-serving/data-service/README.md)
  - [Geocoding](data-serving/data-service/src/geocoding/README.md)
  - [API](verification/curator-service/api/openapi/openapi.yaml)
  - [Load testing](loadtest/README.md)
- Scripts
  - Data service
    - [Converting legacy CSV data to schema-conformant JSON](data-serving/scripts/convert-data/README.md)
    - [Converting & importing legacy data into MongoDb](data-serving/scripts/data-pipeline/README.md)
    - [Exporting MongoDb data to CSV/JSON](data-serving/scripts/export-data/README.md)
    - [Setting up your MongoDB instance](data-serving/scripts/setup-db/README.md)
  - [Curator portal](verification/scripts/README.md)
- How do I...
  - [Update the case schema](data-serving/README.md)
  - [Rotate secrets](aws/README.md#secrets)

### API docs

- [Curator service](https://data.covid-19.global.health/api-docs)
- [Local curator service](http://localhost:3001/api-docs)
- [Local data service](http://localhost:3000/api-docs)

## Sources licenses and terms of use

This repository and daily data exports are published under the MIT license.

Each automatically ingested data source used has a required license and terms of use attachment, forcing curators to look-up the sources they are setting-up for ingestion.

If you are the owner of a data source included here and would like us to remove data, add or alter an attribution, or add or alter license information, please open an issue on this repository and we will happily consider your request.


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fglobaldothealth%2Flist.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fglobaldothealth%2Flist?ref=badge_large)

## Stats

![code size](https://img.shields.io/github/languages/code-size/globaldothealth/list) ![repo size](https://img.shields.io/github/repo-size/globaldothealth/list)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fglobaldothealth%2Flist.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fglobaldothealth%2Flist?ref=badge_shield)

![commit activity](https://img.shields.io/github/commit-activity/w/globaldothealth/list)
