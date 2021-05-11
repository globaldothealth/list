import mapbox
import requests


def mapbox_geocode(access_token, query, types=None, languages=None, limit=None, country=None):
    """Request the location of the point of interest identified in the search query."""
    geocoder = mapbox.Geocoder(access_token=access_token)
    return geocoder.forward(query, types=types, languages=languages, limit=limit, country=country).geojson()


def mapbox_tile_query(access_token, query):
    """Request the full hierarchy of administrative areas for a given location."""
    uri = f"https://api.mapbox.com/v4/mapbox.enterprise-boundaries-a1-v2,mapbox.enterprise-boundaries-a2-v2,mapbox.enterprise-boundaries-a3-v2/tilequery/{query.longitude},{query.latitude}.json?access_token={accessToken}"
    res = requests.get(uri)
    return res.json

