# Global.Health List

[Global.Health](https://global.health)'s mission is to enable rapid sharing of trusted and open public health data to
advance the response to infectious diseases.

This repository contains the servers and scripts that support its data curation efforts.

## Frontends

- [dev](https://dev-curator.ghdsi.org)
- [prod](https://curator.ghdsi.org)

## Daily exports of case data

- [output](data/README.md)
- [data dictionary](data-serving/scripts/export-data/case_fields.yaml)
- [script](data-serving/scripts/export-data/README.md)

## CI/CD status

[All actions](https://github.com/globaldothealth/list/actions)

![Curator Service Github Packages Push](https://github.com/globaldothealth/list/workflows/Curator%20Service%20Github%20Packages%20Push/badge.svg)

![Export prod case data](https://github.com/globaldothealth/list/workflows/Export%20prod%20case%20data/badge.svg)

![Suggest python scripts](https://github.com/globaldothealth/list/workflows/Suggest%20python%20scripts/badge.svg)

![Update case data in dev](https://github.com/globaldothealth/list/workflows/Update%20case%20data%20in%20dev/badge.svg)

![Data Service Github Packages Push](https://github.com/globaldothealth/list/workflows/Data%20Service%20Github%20Packages%20Push/badge.svg)

![Integration Tests CI](https://github.com/globaldothealth/list/workflows/Integration%20Tests%20CI/badge.svg)

![Ingestion functions AWS SAM deploy](https://github.com/globaldothealth/list/workflows/Ingestion%20functions%20AWS%20SAM%20deploy/badge.svg)

![Ingestion functions AWS SAM build](https://github.com/globaldothealth/list/workflows/Ingestion%20functions%20AWS%20SAM%20build/badge.svg)

![Ingestion functions Python CI](https://github.com/globaldothealth/list/workflows/Ingestion%20functions%20Python%20CI/badge.svg)

![Data service Node.js CI](https://github.com/globaldothealth/list/workflows/Data%20service%20Node.js%20CI/badge.svg)

![Curator UI Node.js CI](https://github.com/globaldothealth/list/workflows/Curator%20UI%20Node.js%20CI/badge.svg)

![Curator API Node.js CI](https://github.com/globaldothealth/list/workflows/Curator%20API%20Node.js%20CI/badge.svg)

## Components

- [The data service](data-serving/data-service) in `data-serving/data-service` facilitates CRUD operations with the
  MongoDB database storing case data.
- [The curator service](verification/curator-service/api) in `verification/curator-service/api` serves as the backend
  for the curator portal, which enables curators to view, enter, update, and verify cases; manage data sources and their
  ingestion; and manage portal access.
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
  - [Geocoding](verification/curator-service/api/src/geocoding/README.md)
  - [API](verification/curator-service/api/openapi/openapi.yaml)
- Scripts
  - Data service
    - [Converting legacy CSV data to schema-conformant JSON](data-serving/scripts/convert-data/README.md)
    - [Converting & importing legacy data into MongoDb](data-serving/scripts/data-pipeline/README.md)
    - [Exporting MongoDb data to CSV/JSON](data-serving/scripts/export-data/README.md)
    - [Setting up your MongoDB instance](data-serving/scripts/setup-db/README.md)
  - [Curator portal](verification/scripts/README.md)
- How do I...
  - [Update the case schema](data-serving/README.md)

### API docs

- [Curator service](HTTPS://curator.ghdsi.org/api-docs)
- [Local curator service](http://localhost:3001/api-docs)
- [Local data service](http://localhost:3000/api-docs)

## Stats

![code size](https://img.shields.io/github/languages/code-size/globaldothealth/list) ![repo size](https://img.shields.io/github/repo-size/globaldothealth/list)

![commit activity](https://img.shields.io/github/commit-activity/w/globaldothealth/list)
