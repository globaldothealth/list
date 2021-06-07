import json
import ratelimiter
from lru import LRU

from src.integration.mapbox_client import mapbox_tile_query


class AdminsFetcher:

    def __init__(self, access_token, db, rate_limit=600):
        self.rate_limit = ratelimiter.RateLimiter(max_calls=rate_limit, period=60)
        self.access_token = access_token
        self.admins = db.get_collection('admins')
        self.cache = LRU(500)

    def fill_admins(self, geocode):
        if 'administrativeAreaLevel1' in geocode and \
            'administrativeAreaLevel2' in geocode and 'administrativeAreaLevel3' in geocode:
            return geocode
        cacheKey = json.dumps(geocode)
        if cacheKey in self.cache:
            response = self.cache[cacheKey]
        else:
            response = mapbox_tile_query(self.access_token, geocode['geometry'], rate_limit=self.rate_limit)
            self.cache[cacheKey] = response
        for feature in response['features']:
            layer = feature['properties']['tilequery']['layer']
            name = self.getName(feature['properties']['id'])
            layerKey = self.getKey(layer)
            geocode[layerKey] = name
        if 'administrativeAreaLevel1' in geocode and geocode['administrativeAreaLevel1'] is None:
            del geocode['administrativeAreaLevel1']
        if 'administrativeAreaLevel2' in geocode and geocode['administrativeAreaLevel2'] is None:
            del geocode['administrativeAreaLevel2']
        if 'administrativeAreaLevel3' in geocode and geocode['administrativeAreaLevel3'] is None:
            del geocode['administrativeAreaLevel3']
        return geocode

    def getKey(self, layer):
        return {
            'boundaries_admin_1': 'administrativeAreaLevel1',
            'boundaries_admin_2': 'administrativeAreaLevel2',
            'boundaries_admin_3': 'administrativeAreaLevel3'
        }[layer]

    def getName(self, id):
        return self.admins.find_one({
            'id': id
        })['name']
