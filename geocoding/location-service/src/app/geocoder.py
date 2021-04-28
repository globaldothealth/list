import json
from src.integration.mapbox_client import mapbox_geocode

class Geocoder:
    Country = 'Country'
    Admin3 = 'Admin3'
    Admin2 = 'Admin2'
    Admin1 = 'Admin1'
    Point = 'Point'

    def __init__(self, api_token):
        """Needs a mapbox API token."""
        self.api_token = api_token
        self.cache = {}
    
    def resolutionToMapboxType(self, resolution):
        """Map (sorrynotsorry) from our names for administrative regions to mapbox's names."""
        return {
            Geocoder.Country: 'country',
            Geocoder.Admin3: 'place',
            Geocoder.Admin2: 'district',
            Geocoder.Admin1: 'region',
            Geocoder.Point: 'poi'
        }[resolution]
    
    def getFeatureDescriptionFromContext(self, contexts, level):
        """Find out the name of a feature at a particular administrative level."""
        for f in contexts:
            if f['id'].startswith(level):
                return f['text']
        return ''
    
    def getResolution(self, contexts):
        """Find out the level of detail of a geocoding result"""
        types = {c['id'].split('.')[0] for c in contexts}
        if 'poi' in types:
            return Geocoder.Point
        elif 'place' in types:
            return Geocoder.Admin3
        elif 'district' in types:
            return Geocoder.Admin2
        elif 'region' in types:
            return Geocoder.Admin1
        else:
            return Geocoder.Country

    def unpackGeoJson(self, feature):
        """Turn mapbox geojson into the data structure we need."""
        contexts = [feature]
        if ('context' in feature):
            for c in feature['context']:
                contexts.append(c)
        res = {
            'geometry': {
                'longitude': feature['center'][0],
                'latitude': feature['center'][1]
            },
            'name': feature['place_name'],
            'country': self.getFeatureDescriptionFromContext(contexts, 'country'),
            'place': self.getFeatureDescriptionFromContext(contexts, 'poi'),
            'geoResolution': self.getResolution(contexts)
        }
        # TODO fill in the administrative areas
        return res

    def geocode(self, query, options={}):
        cacheKey = json.dumps({
            'query': query.lower(),
            'options': options
        })
        if cacheKey in self.cache:
            return self.cache[cacheKey]
        types = None
        if 'limitToResolution' in options:
            types = [self.resolutionToMapboxType(i) for i in options['limitToResolution']]
        geoResult = mapbox_geocode(self.api_token, query, types=types, limit=5, languages=['en'])
        response = [self.unpackGeoJson(feature) for feature in geoResult['features']]
        self.cache[cacheKey] = response
        return response
