import iso3166
import requests

from typing import Any, Dict, List, Union

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
                f"Geocoding service responded with status {response.status_code} for query {query}"
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
        p = Point()
        try:
            geometry = location["geometry"]
            p.coordinates = [geometry["latitude"], geometry["longitude"]]
        except KeyError:
            raise DependencyFailedError(f"location {location} doesn't have coordinates")
        f = Feature()
        f.geometry = p
        try:
            f.properties = {"country": self.iso_two_to_three(location["country"])}
        except KeyError:
            raise DependencyFailedError(f"location {location} doesn't have a country")
        dict_set_if_present(
            f.properties, "admin1", location.get("administrativeAreaLevel1", None)
        )
        dict_set_if_present(
            f.properties, "admin2", location.get("administrativeAreaLevel2", None)
        )
        dict_set_if_present(
            f.properties, "admin3", location.get("administrativeAreaLevel3", None)
        )
        dict_set_if_present(f.properties, "place", location.get("place", None))
        dict_set_if_present(f.properties, "name", location.get("name", None))
        dict_set_if_present(
            f.properties, "resolution", location.get("geoResolution", None)
        )
        f.properties["query"] = query
        return f

    def iso_two_to_three(self, iso2: str) -> str:
        """Given an ISO-3166-1 two-letter country code like US, return a three-letter code like USA.
        Raises DependencyFailedError if given a two-letter code that I cannot find."""
        country = iso3166.countries.get(iso2)
        if country is None:
            raise DependencyFailedError(f"Country code {iso2} is not known")
        return country.alpha3


def dict_set_if_present(dest: Dict, key: str, value: Any):
    """Set a key in a dictionary only if the value is not None."""
    if value is not None:
        dest[key] = value
