import iso3166
import json
import logging
import ratelimiter
import sys
import functools


from src.integration.mapbox_client import mapbox_geocode

h = logging.StreamHandler(sys.stdout)
logger = logging.getLogger(__name__)
logger.addHandler(h)
logger.setLevel(logging.INFO)

class Geocoder:
    Country = 'Country'
    Admin3 = 'Admin3'
    Admin2 = 'Admin2'
    Admin1 = 'Admin1'
    Point = 'Point'
    INDEX = {c.name.lower(): c for c in iso3166.countries}

    def __init__(self, api_token, admins_fetcher, rate_limit=600):
        """Needs a mapbox API token."""
        self.rate_limit = ratelimiter.RateLimiter(max_calls=rate_limit, period=60)
        self.api_token = api_token
        self.admins_fetcher = admins_fetcher

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

    def getISO3166Code(self, countryName):
        """
        Get the single matching Country's ISO-3166-2 code from a partial name.
        countryName:  The country name, or sub-string thereof, to find.
        Return:  The ISO-3166 two-letter code, or None if the countryName was unfound or ambiguous.
        """
        logger.debug(f"Getting country code for {countryName}")
        # workaround a common problem: "United States" is the Mapbox name for US, but the algorithm
        # below will also find UM (United States Minor Outlying Islands) and fail because the
        # query is ambiguous.
        #
        # additionally the PRC is not in the iso3166 list (but China is).
        fixups = {
            'united states': 'US',
            "people's republic of china": 'CN'
        }
        name = countryName.lower()
        if fixedCode := fixups.get(name):
            return fixedCode
        
        country = None
        for key in Geocoder.INDEX:
            if name in key:
                if country is not None:
                    # Ambiguous countryName
                    logger.error(f"Country {countryName} is ambiguous, found both {country} and {Geocoder.INDEX[key]}")
                    return None
                country = Geocoder.INDEX[key]

        if country is not None:
            logger.debug(f"code for {countryName} is {country.alpha2}")
            return country.alpha2
        logger.error(f"Country {countryName} not found in iso3166.countries!")
        return None


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
            'country': self.getISO3166Code(self.getFeatureDescriptionFromContext(contexts, 'country')),
            'place': self.getFeatureDescriptionFromContext(contexts, 'poi'),
            'geoResolution': self.getResolution(contexts)
        }
        self.admins_fetcher.fill_admins(res)
        return res

    @functools.lru_cache(500)
    def cached_mapbox_geocode(self, query: str, options: str):
        options = json.loads(options)
        limit_resolution = options.get("limitToResolution", [])
        limit_country = options.get("limitToCountry")
        types = [self.resolutionToMapboxType(i) for i in limit_resolution] if limit_resolution else None
        geoResult = mapbox_geocode(
            self.api_token,
            json.loads(query),
            types=types, limit=5,
            languages=['en'],
            country=limit_country,
            rate_limit=self.rate_limit
        )
        return [self.unpackGeoJson(feature) for feature in geoResult['features']]

    def geocode(self, query, options={}):
        return self.cached_mapbox_geocode(json.dumps(query), json.dumps(options))
