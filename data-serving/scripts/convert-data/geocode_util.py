from typing import Any, Callable, Dict, NamedTuple, Tuple


class Geocode(NamedTuple):
    lat: float
    lng: float
    geo_resolution: str
    country_new: str
    admin_id: int
    location: str
    admin3: str
    admin2: str
    admin1: str


def lookup_location(
        geocoder: Any, location_cache: Dict[Tuple, Tuple],
        location_tokens: [str]) -> Geocode:
    '''
    Attempts to match the provided location tokens against known locations using
    the provided geocoder.

    Parameters:
        location_tokens: One or more tokens representing a location, which
          may represent a part or whole of a location of any resolution.
          Examples: ['NY'], ['Paris, France'], ['Wuhan City, Hubei, China'],
          ['China']

    Raises:
        ValueError: When the provided location string could not be mapped to a
          single, valid geocoding result.
    Returns:
      Geocode
    '''
    normalized_tokens = [l.lower() for l in location_tokens]

    if not normalized_tokens:
        raise ValueError('No location tokens')
    if len(normalized_tokens) > 3:
        raise ValueError('Too many tokens in location')

    # If that token is a common abbreviation, geocode it using the full
    # location we have cached. Otherwise, look it up by its token.
    cached_location = location_cache.get(tuple(normalized_tokens))

    matches = []
    if cached_location:
        match = geocoder.geocode(
            cached_location[0] or '', cached_location[1] or '',
            cached_location[2] or '')
        matches = [match] if match else []
    elif len(normalized_tokens) == 1:
        # A location of a single token, which may be a country, city, province,
        # etc. Ex. "Paris", "China", "FL"
        matches = lookup_single_part_location(geocoder, normalized_tokens[0])
    elif len(normalized_tokens) == 2:
        # A two-part location, which may be (province, country), (city,
        # province), or (city, country) pairs. Ex. "Paris, France", "Hubei,
        # China", "Boston, MA"
        matches = lookup_two_part_location(
            geocoder, normalized_tokens[0],
            normalized_tokens[1])
    else:
        # A three-part location, presumed to include city, province, and
        # country.
        match = geocoder.geocode(
            normalized_tokens[0],  # city
            normalized_tokens[1],  # province
            normalized_tokens[2])  # country
        matches = [match] if match else []

    if not matches:
        raise ValueError('No geocode found for location string')
    elif len(matches) > 1:
        raise ValueError(
            f'Ambiguous location string; matches multiple geocodes: {matches}')
    else:
        return matches[0]


def lookup_two_part_location(
        geocoder: Any, higher_res_location_token: str,
        lower_res_location_token: str) -> [Geocode]:
    '''
    Attempts to match the two location tokens against known locations,
    trying two-token pairs, including (country, province), (city, country), and
    (city, province).

    Parameters:
        higher_res_location_token: The token representing the more specific part
          of the location, e.g. city vs. country.
        lower_res_location_token: The token representing the broader part of the
          location, e.g. province vs. city.

    Returns:
      [Geocode] A list of possible geocode matches.
    '''
    matches = [
        # (province, country)
        lookup(
            geocoder, lambda location: location.admin1.lower() ==
            higher_res_location_token and location.country_new.lower() ==
            lower_res_location_token and location.geo_resolution == 'admin1'),
        # (city, country)
        lookup(
            geocoder, lambda location: location.admin2.lower() ==
            higher_res_location_token and location.country_new.lower() ==
            lower_res_location_token and location.geo_resolution == 'admin2'),
        # (city, province)
        lookup(
            geocoder, lambda location: location.admin2.lower() ==
            higher_res_location_token and location.admin1.lower() ==
            lower_res_location_token and location.geo_resolution == 'admin2')]
    return [item for sublist in matches for item in sublist]


def lookup_single_part_location(geocoder: Any, value: str) -> [Geocode]:
    '''
    Attempts to match the location token against known locations, ranging from
    country to specific point locations.

    Returns:
      [Geocode] A list of possible geocode matches.
    '''
    matches = [
        # country
        lookup(geocoder, lambda location: location.country_new.lower()
               == value and location.geo_resolution == 'admin0'),
        # province
        lookup(geocoder, lambda location: location.admin1.lower()
               == value and location.geo_resolution == 'admin1'),
        # city
        lookup(geocoder, lambda location: value ==
               location.admin2.lower() and location.geo_resolution == 'admin2'),
        # admin3
        lookup(geocoder, lambda location: value ==
               location.admin3.lower() and location.geo_resolution == 'admin3'),
        # point location
        lookup(geocoder, lambda location: value ==
               location.location.lower() and location.geo_resolution == 'point')
    ]
    return [item for sublist in matches for item in sublist]


def lookup(geocoder: Any, predicate: Callable[[str], bool]) -> [Geocode]:
    '''
    Finds a geocode match given a predicate. The predicate could, for example,
    require that the result match a given string and a given geographical
    resolution.

    Returns:
      [Geocode] A list of possible geocode matches.
    '''
    return [
        geocode for id, geocode in geocoder.geocodes.items()
        if predicate(geocode)]
