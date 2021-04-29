import mapbox


def mapbox_geocode(access_token, query, types=None, languages=None, limit=None):
    """Request the location of the point of interest identified in the search query."""
    geocoder = mapbox.Geocoder(access_token=access_token)
    return geocoder.forward(query, types=types, languages=languages, limit=limit).geojson()

def mapbox_tile_query(access_token, query):
    """Request the full hierarchy of administrative areas for a given location."""
    pass
