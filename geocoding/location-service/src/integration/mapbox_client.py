import mapbox

def mapbox_geocode(access_token, query):
    """Request the location of the point of interest identified in the search query.
    For the moment this is just whatever gets returned by mapbox."""
    geocoder = mapbox.Geocoder(access_token=access_token)
    return geocoder.forward(query).geojson()
