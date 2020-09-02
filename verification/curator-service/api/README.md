# Global Health Curator Service

This package contains the Node JS express server responsible for serving the API calls for the curators to interact with the Global Health ingestion system.

It handles CRUD of cases, ingestion sources, users and offers a geocoding service.

## Cases

Cases are unique occurences of a person having tested positive to a particular illness.

Human curators go over official reports/news articles and enter detailed information about those cases to help researchers consume that data to build epidemiologic models for example.

Given proper permissions, one can see the cases in the UI at https://curator.ghdsi.org/cases.

## Sources

A source is an authoritative URL provided by an organization (government, NGO or news organization) that provides information about _cases_.

Curators can go over those sources to enter the data manually as described earlier or automated scrapers and parsers can go over the more structured sources and try to automatically create the relevant cases data.

Given proper permissions, one can see the sources in the UI at https://curator.ghdsi.org/sources.

## Users

Users are either service-accounts API users (authenticated with bearer tokens) or human users (authenticated with Google OAuth 2.0). Authentication, roles and users in general is described in more details in the `../auth.md` document.

You can see your profile in the UI at https://curator.ghdsi.org/profile.

Given proper permissions, one can see the users in the UI at https://curator.ghdsi.org/users.

## Gecoding

Gecoding is described in details in `src/geocoding/README.md`.

## Open API

The developer-focused Open API definitions can be found in `openapi/openapi.yaml` and a Swagger UI is exposed at the `/api-docs` HTTP endpoint.

For example: https://curator.ghdsi.org/api-docs/

## Development

Run the stack by executing the `/dev/run_stack.sh` script or simply launch the curator service alone by running `npm start` from this directory.

### Code structure

`src/` contains the server code, it is compiled from Typescript to Javascript and reloaded automatically during development.

`src/clients` contains client code to talk to external services like AWS CloudWatch for example.

`src/controllers` contains the express HTTP handlers.

`src/geocoding` contains interfaces, testing utilities and geocoding implementation using [Mapbox](https://www.mapbox.com).

`src/model` contains the [mongoose](https://mongoosejs.com/) schema and model definitions for the sources and users.

`src/schemas` contains the MongoDB schema definitions.

`index.ts` connects to the DB, set-ups all HTTP handlers.

`server.ts` starts the express server.

## External dependencies

This server depends on:

- AWS Cloud Watch when setting-up automated ingestion sources.
- AWS Lambda when triggering archival of sources data.
- Global Health Data Service (`/data-serving/data-service`) to store CRUD case data.
- Mapbox geocoding service when doing geocoding.
- MongoDB for about everything.
- Google OAuth 2.0 for authentication.

### Unit tests

All components should have unit tests associated with them.
You can find them under the `test` directory and run them with `npm test`.