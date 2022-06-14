'''
  Library of functions that parse a typed value from a string, e.g. bool, numeric,
  list, or enum.

  The convention is for each of these parsers to return None when the value is
  absent, or effectively absent (i.e. the string "na" or "none"). The parsers will
  throw if the input value cannot be succesfully parsed, given the output type and
  other constraints.

  These parsers should have no notion of the input or output document format, nor
  should they log errors; they should raise exceptions for the converters to
  handle.
  '''

import re
import datetime
from typing import Any, Callable, Dict, List, Tuple
from constants import (COMMON_LOCATION_ABBREVIATIONS,
                       VALID_GEO_RESOLUTIONS, VALID_SEXES)
from utils import trim_string_list
from geocode_util import lookup_location


def parse_list(value: Any, separator: str) -> List[str]:
    '''
    Parses the input into a list of (trimmed) strings on the given separator, if
    it appears in the input.

    Parameters:
      value: A value representing a single or multiple items, separated by the
        provided separator.
      separator: A string that separates the values in the list.

    Returns:
      List[str]: Always.
    '''
    return trim_string_list(value.split(separator))


def parse_bool(value: Any) -> bool:
    '''
    Parses the input into a bool.

    Parameters:
      value: A bool or string representing a boolean value, which may include:
        true, false, yes, no, or na.

    Raises:
      ValueError if the value is not a valid bool.
    Returns:
      None: When the input value is empty or a string indicating n/a.
      bool: When the value is present and successfully parsed.
    '''
    if value is None or value == 'na':
        return None

    # Throw an error if the value can't be converted to a boolean.
    if not re.match(r'\b(true|yes|false|no)\b', value, re.IGNORECASE):
        raise ValueError('not a valid bool')

    # If it can be converted to a boolean, return whether it's True or False.
    return True if re.match(r'\b(true|yes)\b', value, re.IGNORECASE) else False


def parse_range(
        value: Any,
        parse_fn: Callable[[str], Any]) -> Tuple[Any, Any]:
    '''
    Converts either a string representation of a single value or a range of
    values into a range object. The values can be of any types using the custom
    parse and format functions.

    Parameters:
      value: A value to be parsed into a range.
      parse_fn: The parser to apply to the start and end values of the range.

    Returns:
      Tuple[Any, Any]: Always. The tuple is in the format (start, end).
    '''
    if not value:
        return (None, None)

    # First check if the value is represented as a range.
    if type(value) is str and value.find('-') >= 0:
        value_range = parse_list(value, '-')

        # Handle open ranges (i.e. missing start or end).
        first_val = parse_fn(value_range[0])
        if len(value_range) == 1:
            return (None, first_val) if value.startswith('-') else (first_val, None)

        # Handle cases with a start and end.
        second_val = parse_fn(value_range[1])
        return (first_val, second_val)

    # Handle values represented as an open-ended range, e.g. "90+".
    if type(value) is str and value.endswith('+'):
        return (parse_fn(value[:-1]), None)

    # We have a specific value. We create a range with identical start and end
    # values.
    parsed_value = parse_fn(value)
    return (parsed_value, parsed_value)


def parse_age(value: Any) -> float:
    '''
    Parses a numeric age from the given value. Handles strings and numeric
    inputs, including some age-specific string reoresebtatuibs such as "x
    months" or "y weeks."

    Parameters:
      value: String or numeric value representing an age.

    Raises:
      ValueError: If the value can't be parsed into a valid age.
    Returns:
      None: When the value is empty.
      float: When the value is present and successfully parsed.
    '''
    if not value:
        return None

    if type(value) is str:
        # Convert ages in the format of "x month(s)" to floats
        num_months = re.findall(r'(\d+)\smonth', value)
        if num_months:
            return int(num_months[0]) / 12

        # Convert ages in the format "x week(s)" to floats
        num_weeks = re.findall(r'(\d+)\sweek', value)
        if num_weeks:
            return int(num_weeks[0]) / 52

    value = float(value)

    # Check that the age is within the valid range.
    if value < -1 or value > 300:
        raise ValueError('age outside of valid range')

    return float(value)


def parse_date(value: str) -> datetime:
    '''
    Parses dates into datetime objects.

    Parameters:
      value: Date string expected to be in the format dd.mm.YY.

    Raises:
        ValueError if the value can't be successfully parsed into a datetime.
    Returns:
      None: When the value is empty.
      datetime: When the value is present and successfully parsed.
    '''
    if not value:
        return None

    try:
        return datetime.datetime.strptime(value, '%d.%m.%Y')
    except ValueError:
        # Sometimes values have month and day accidentally inverted -- oops!
        return datetime.datetime.strptime(value, '%m.%d.%Y')


def parse_location(geocoder: Any, value: Any) -> Dict[str, Any]:
    '''
    Parses a location from a string.

    Parameters:
        value: Value representing a location, expected to be in the format:
          - "$city, $country"
          - "$country"
          - "traveled to (the) ($city,) $country"
          - "travelled to (the) ($city,) $country"

    Raises:
        ValueError: If the location does not conform to the expected format.
        LookupError: If the location conforms to the expected format but cannot
          be found in the pycountry database.
    Returns:
      None: When the input value is empty or a string indicating n/a.
      Dict[str, Any]: When the value is present and successfully parsed. The
        dictionary is in the format:
        {
          'country': str,
          'administrativeAreaLevel1': str,
          'administrativeAreaLevel2': str,
          'locality': str,
          'geometry': {
            'latitude': float,
            'longitude': float
          }
        }
    '''
    if type(value) is not str:
        raise ValueError('location is not a string')

    # Parse the location string into tokens (e.g. city, province, country) and
    # try to find a match with the geocoder.
    geocode_result = lookup_location(
        geocoder, COMMON_LOCATION_ABBREVIATIONS, parse_list(
            value.lower(),
            ','))

    result = {
        'country': geocode_result.country_new,
        'geometry': {
            'latitude': geocode_result.lat,
            'longitude': geocode_result.lng
        }
    }

    if geocode_result.admin1:
        result['administrativeAreaLevel1'] = geocode_result.admin1
    if geocode_result.admin2:
        result['administrativeAreaLevel2'] = geocode_result.admin2
    if geocode_result.admin3:
        result['administrativeAreaLevel3'] = geocode_result.admin3
    if geocode_result.location:
        result['place'] = geocode_result.location
    if geocode_result.geo_resolution:
        result['geoResolution'] = parse_geo_resolution(
            geocode_result.geo_resolution)

    return result


def parse_location_list(geocoder: Any, value: Any) -> [Dict[str, Any]]:
    '''
    Parses one or more locations from a string.

    Parameters:
        value: Value representing a location or a delimiter-separated list of
          locations.

    Returns:
      None: When the input value is empty or a string indicating n/a.
      [Dict[str, Any]]: When the value is present and successfully parsed.
        A list of dictionaries containing the location data.
    '''
    separator = None
    if not value:
        return None
    if ';' in value:
        separator = ';'
    if ':' in value:
        separator = ':'

    locations = parse_list(value, separator) if separator else [value]
    return [parse_location(geocoder, loc) for loc in locations if loc]


def parse_sex(value: Any) -> str:
    '''
    Parses a sex enum value from the input.

    Parameters:
      value: Value representing a sex expected to be one of "male", "female."

    Raises:
      ValueError: The value is not in the sex enum.
    Returns:
      None: When the input value is empty or a string indicating n/a.
      str: When the value is present and successfully parsed.
    '''
    if not value:
        return None

    if str(value).lower() not in VALID_SEXES:
        raise ValueError('sex not in enum')

    return str(value).capitalize()


def parse_latitude(value: Any) -> float:
    '''
    Parses latitude from the input.

    Parameters:
      value: Value representing a latitude.

    Raises:
      ValueError: The value is not a float within [-90, 90].
    Returns:
      None: When the input value is empty.
      float: When the value is present and successfully parsed.
    '''
    if not value:
        return None

    latitude = float(value)

    if latitude < -90 or latitude > 90:
        raise ValueError('latitude outside of valid range')

    return latitude


def parse_longitude(value: Any) -> float:
    '''
    Parses longitude from the input.

    Parameters:
      value: Value representing a longitude.

    Raises:
      ValueError: The value is not a float within [-180, 180].
    Returns:
      None: When the input value is empty.
      float: When the value is present and successfully parsed.
    '''
    if not value:
        return None

    longitude = float(value)

    if longitude < -180 or longitude > 180:
        raise ValueError('longitude outside of valid range')

    return longitude


def parse_geo_resolution(value: Any) -> str:
    '''
    Parses a geo resolution enum value from the input.

    Parameters:
      value: Value representing a geo resolution, expected to be one of "place",
        "adminAreaL1", "adminAreaL2", or "country."

    Raises:
      ValueError: The value is not in the geo resolution enum.
    Returns:
      None: When the input value is empty or a string indicating n/a.
      str: When the value is present and successfully parsed.
    '''
    if not value:
        return None

    geo_resolution = VALID_GEO_RESOLUTIONS.get(str(value).lower())
    if not geo_resolution:
        raise ValueError('geo resolution not in enum')

    return geo_resolution.capitalize()


def parse_string_list(value: Any) -> List[str]:
    '''
    Parses a list of strings from the input.

    Parameters:
      value: Value representing a list of strings. The value is expected to be a
        comma- or colon-separated string.

    Raises:
      ValueError: The value does not conform to the expected format.
    Returns:
      None: When the input value is empty.
      List[str]: When the value is present and successfully parsed.
    '''
    if not value:
        return None
    if type(value) is not str:
        raise ValueError('not a string')

    is_comma_delimited = value.find(',') >= 0
    is_colon_delimited = value.find(':') >= 0

    if is_comma_delimited:
        if is_colon_delimited:
            raise ValueError('two delimiters detected')

        return parse_list(value, ',')
    if is_colon_delimited:
        return parse_list(value, ':')

    # Assuming this wasn't a list, but a singular value.
    return [value]


def parse_url(value: Any) -> str:
    # TODO: Too noisy right now. Use a more accurate URL parser before throwing.
    # if not is_url(value):
    #  raise ValueError('not a valid URL')

    return value
