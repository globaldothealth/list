# Geocoding of cases

This directory contains a Geocoder using the Mapbox geocoding API.

The Mapbox specific implementation in `mapbox.ts` should only be used when injecting the Geocoder into the Curator service and consumers should just rely on the `Geocoder` interface instead defined in `geocoder.ts`.

This is to be able to easily swap to another geocoding service if needs be.

## Mapbox specificities

You can play with the Mapbox geocoding API freely at [this URL](https://docs.mapbox.com/search-playground/).

Check-out their [documentation](https://docs.mapbox.com/api/search/) as well.

In order to be able to use the `mapbox.places-permanent` endpoint that is needed for storing the results as per Mapbox usage policy, you need to set the right secret token in the `MAPBOX_TOKEN` environment variable.

If the `MAPBOX_PERMANENT_GEOCODE` environment variable isn't set, the geocoder will default to the `mapbox.places` endpoint instead which is useful during development.