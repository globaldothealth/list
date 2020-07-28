# Geocoding of cases

This directory contains a Geocoder using the Mapbox geocoding API.

The Mapbox specific implementation in `mapbox.ts` should only be used when injecting the Geocoder into the Curator service and consumers should just rely on the `Geocoder` interface instead defined in `geocoder.ts`.

This is to be able to easily swap to another geocoding service if needs be.

## When and where does geocoding happen?

If a new case is submitted or an existing case is edited and no lat/lng is provided, the curator service will attempt to geocode the request's `location.query` field.
It will return a list of `GeocodeResult` as defined in `geocoder.ts`.

Maximum 5 results will be returned in order of relevance, as such they are suitable for autocompleting the `location.query` field in the UI as well.

## Integration testing

We can't (and don't want to either because it's costly) use the mapbox geocoder in integration testing, `index.ts` will look at the `MAPBOX_TOKEN` environment variable and if it is empty, it will use a fake geocoder instead with seedable responses so that the overall flow can still be tested without any additional cost.

The fake geocoder exposes a `/api/seed/geocode` endpoint during integration testing that can be fed a `GeocodeResult` and it will return it if the query it gets during geocode matches its `text` property.

## Mapbox specificities

You can play with the Mapbox geocoding API freely at [this URL](https://docs.mapbox.com/search-playground/).

Check-out their [documentation](https://docs.mapbox.com/api/search/) as well.

In order to be able to use the `mapbox.places-permanent` endpoint that is needed for storing the results as per Mapbox usage policy, you need to set the right secret token in the `MAPBOX_TOKEN` environment variable.

If the `MAPBOX_PERMANENT_GEOCODE` environment variable doesn't parse as `true` (cf. `src/util/validate-env.ts`), the geocoder will default to the `mapbox.places` endpoint instead which is useful during development.

## Fetch of administrative areas.

Geocode results returned by Mapbox sometimes do not contain the full hierarchical information necessary to fill all administrative area levels.

In order to fill the missing admins we make use of the Boundaries API that Mapbox offers.
It allows us to query administrative area names in the world based on the centroid of a feature.

Note that this API is private and its official documentation is kind of lacking... Once you register, Mapbox folks send you a bunch of files with more information on administrative levels (like names in various languages, centroids, etc).

You can check a live demo of the coverage of the boundaries API at https://www.mapbox.com/boundaries/#coverage-map. This is also useful to check why such an admin is empty (Brasil doesn't have admin 3 for example).

We preprocess these files with the `/verification/scripts/gen_boundaries.sh` script and import the mapping of admin IDs to their English names in Mongo DB with the `/verification/scripts/import_boundaries.sh`. This process only needs to be done once for the lifetime of the Mongo DB database.