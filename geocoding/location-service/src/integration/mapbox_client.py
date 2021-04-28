import mapbox


def mapbox_geocode(access_token, query, types=None, languages=None, limit=None):
    """Request the location of the point of interest identified in the search query.
    For the moment this is just whatever gets returned by mapbox."""
    geocoder = mapbox.Geocoder(access_token=access_token)
    return geocoder.forward(query, types=types, languages=languages, limit=limit).geojson()
