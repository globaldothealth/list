from typing import Any, Callable
from constants import COMMON_LOCATION_ABBREVIATIONS


def lookup_location(geocoder: Any, location_tokens: [str]) -> Any:
    '''
    Attempts to match the provided location tokens against known locations using
    the provided geocoder.

    Parameters:
        location_tokens: One or more tokens representing a location, which 
          may represent a part or whole of a location of any resolution.
          Examples: ['NY'], ['Paris, France'], ['Wuhan City, Hubei, China'],
          ['China']

    Raises:
        ValueError: When the location consists of more than 3 tokens.
    Returns:
      None: When no location tokens are passed in or no geocoding match is
        found.
      [Dict[str, Any]]: Location data of the form:
        {
          lat: float
          lng: float
          geo_resolution: str
          country_new: str
          admin_id: int
          location: str
          admin3: str
          admin2: str
          admin1: str
        }
    '''
    normalized_tokens = [COMMON_LOCATION_ABBREVIATIONS.get(l.lower(), l)
                         for l in location_tokens]

    if not normalized_tokens:
        raise ValueError('No location tokens')
    if len(normalized_tokens) > 3:
        raise ValueError('Too many tokens in location')

    if len(normalized_tokens) == 1:
        # A location of a single token, which may be a country, city, county,
        # etc. Ex. "Paris", "China", "FL"
        return lookup_single_part_location(geocoder, normalized_tokens[0])
    elif len(normalized_tokens) == 2:
        # A two-part location, which may be (county, country), (city, county),
        # or (city, country) pairs. Ex. "Paris, France", "Hubei, China",
        # "Boston, MA"
        return lookup_two_part_location(
            geocoder, normalized_tokens[0],
            normalized_tokens[1])
    else:
        # A three-part location, presumed to include city, county, and country.
        return geocoder.geocode(
            normalized_tokens[0],  # city
            normalized_tokens[1],  # county
            normalized_tokens[2])  # country


def lookup_two_part_location(
        geocoder: Any, higher_res_location_token: str,
        lower_res_location_token: str) -> Any:
    '''
    Attempts to match the two location tokens against known locations,
    trying two-token pairs from broadest to most specific resolution. First we
    check if it's a province and county pair; then city and country; then city
    and province.

    Parameters:
        higher_res_location_token: The token representing the more specific part
          of the location, e.g. city vs. country.
        lower_res_location_token: The token representing the broader part of the
          location, e.g. county vs. city.

    Returns:
      None: When no geocoding match is found.
      [Dict[str, Any]]: Location data of the form:
        {
          lat: float
          lng: float
          geo_resolution: str
          country_new: str
          admin_id: int
          location: str
          admin3: str
          admin2: str
          admin1: str
        }
    '''
    province_and_country = lookup(
        geocoder, lambda location: location.admin1.lower() ==
        higher_res_location_token and location.country_new.lower() ==
        lower_res_location_token and location.geo_resolution == 'admin1')

    if province_and_country:
        return province_and_country

    city_and_country = lookup(
        geocoder, lambda location: location.admin2.lower() ==
        higher_res_location_token and location.country_new.lower() ==
        lower_res_location_token and location.geo_resolution == 'admin2')

    if city_and_country:
        return city_and_country

    city_and_province = lookup(
        geocoder, lambda location: location.admin2.lower() ==
        higher_res_location_token and location.admin1.lower() ==
        lower_res_location_token and location.geo_resolution == 'admin2')

    if city_and_province:
        return city_and_province

    return None


def lookup_single_part_location(geocoder: Any, value: str) -> Any:
    '''
    Attempts to match the location token against known locations, beginning from
    lowest resolution and moving to higher resolutions if no match is found. No
    Paris, TX matches for "Paris" over here.

    Returns:
      None: When no geocoding match is found.
      [Dict[str, Any]]: Location data of the form:
        {
          lat: float
          lng: float
          geo_resolution: str
          country_new: str
          admin_id: int
          location: str
          admin3: str
          admin2: str
          admin1: str
        }
    '''
    country = lookup(geocoder, lambda location: location.country_new.lower()
                     == value and location.geo_resolution == 'admin0')
    if country:
        return country

    province = lookup(geocoder, lambda location: location.admin1.lower()
                      == value and location.geo_resolution == 'admin1')
    if province:
        return province

    city = lookup(geocoder, lambda location: value ==
                  location.admin2.lower() and location.geo_resolution == 'admin2')
    if city:
        return city

    admin3 = lookup(geocoder, lambda location: value ==
                    location.admin3.lower() and location.geo_resolution == 'admin3')
    if admin3:
        return admin3

    location = lookup(geocoder, lambda location: value == location.location.lower(
    ) and location.geo_resolution == 'point')
    if location:
        return location

    return None


def lookup(geocoder: Any, predicate: Callable[[str], bool]) -> Any:
    '''
    Finds a single geocode match given a predicate. The predicate could, for
    example, require that the result match a given string and a given
    resolution. If more than one match is found for the predicate, an error is
    thrown.

    Raises:
      ValueError: When more than one match is found for the predicate, since we
        are unable to determine which is correct.
    Returns:
      None: When no geocoding match is found.
      [Dict[str, Any]]: Location data of the form:
        {
          lat: float
          lng: float
          geo_resolution: str
          country_new: str
          admin_id: int
          location: str
          admin3: str
          admin2: str
          admin1: str
        }
    '''
    matches = [
        geocode for id, geocode in geocoder.geocodes.items()
        if predicate(geocode)]

    if len(matches) > 1:
        raise ValueError(f'Too many possible geocode matches: {matches}')

    return matches[0] if len(matches) == 1 else None
