import iso3166
import requests

from typing import Dict, List, Union

from data_service.model.geojson import Feature, Point
from data_service.util.errors import DependencyFailedError


class Geocoder:
    """Call the location-service to identify locations."""

    def __init__(self, location_service: str):
        self.location_endpoint = f"{location_service}/geocode"

    def locate_feature(self, query: str) -> List[Feature]:
        """Make a query to the location-service and turn its response
        into GeoJSON. Additionally turns the ISO 3166-1 alpha-2 codes
        used by the location-service into ISO 3166-1 alpha-3 codes.
        Raises DependencyFailedError if the location-service is unreachable
        or responds with any status code other than 200, or if it returns
        an empty list of locations, or a location that cannot be turned
        into a feature."""
        response = requests.get(self.location_endpoint, {"q": query})
        if response.status_code != 200:
            raise DependencyFailedError(
                f"Geocoding service responded with status {response.status} for query {query}"
            )
        locations = response.json()
        if len(locations) == 0:
            raise DependencyFailedError(
                f"Geocoding service returned no locations for query {query}"
            )
        features = [self.create_feature(l, query) for l in locations]
        return features

    def create_feature(self, location: Dict[str, Union[str, float]], query: str):
        """Turn a location-service response into a GeoJSON feature."""
        geometry = location["geometry"]
        p = Point()
        p.coordinates = [geometry["latitude"], geometry["longitude"]]
        f = Feature()
        f.geometry = p
        f.properties = {
            "country": self.iso_two_to_three(location["country"]),
            "admin1": location["administrativeAreaLevel1"],
            "admin2": location["administrativeAreaLevel2"],
            "admin3": location["administrativeAreaLevel3"],
            "place": location["place"],
            "name": location["name"],
            "resolution": location["geoResolution"],
            "query": query,
        }
        return f

    def iso_two_to_three(self, iso2: str) -> str:
        """Given an ISO-3166-1 two-letter country code like US, return a three-letter code like USA.
        Raises DependencyFailedError if given a two-letter code that I cannot find."""
        country = iso3166.countries.get(iso2)
        if country is None:
            raise DependencyFailedError(f"Country code {iso2} is not known")
        return country.alpha3
