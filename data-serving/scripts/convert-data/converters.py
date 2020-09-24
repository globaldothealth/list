'''
Library of conversion functions for converting CSV line-list data to json.

The converters are specifically responsible for converting the input fields to
the new format; they call parsers as necessary to parse typed values from input
strings and then format them to match the output schema.

Converters log errors thrown by the parsers, since they have the context on
which row failed to convert.
'''

from parsers import (parse_age, parse_bool, parse_date, parse_geo_resolution,
                     parse_latitude, parse_list, parse_location_list,
                     parse_longitude, parse_range, parse_sex, parse_string_list,
                     parse_url)
from typing import Any, Callable, Dict, List, Tuple
from utils import format_iso_8601_date, log_error


def convert_range(value: Any, parser: Callable[[Any], Any],
                  formatter: Callable[[Any], Any]) -> Dict[str, Any]:
    '''
    Converts a value to a range format, given the provided parser and formatter.

    Parameters:
      value: Input to be parsed and formatted as a range.
      parser: Function to parse the start and end values into the expected type.
      formatter: Function to format the output start and end values.

    Returns:
      None: When the input value is empty.
      Dict[str, Any]: When the value is present and successfully parsed. The
        dictionary is in the format:
        {
          'start': Any,
          'end': Any
        }
        where start == end if value represents a single value, as opposed to a
        range, and where the type of the values is dictated by the parser and
        formatter.
    '''
    start, end = parse_range(value, parser)

    range = {}
    if start is not None:
        range['start'] = formatter(start)
    if end is not None:
        range['end'] = formatter(end)

    return range or None


def convert_age_range(ages: Any) -> Dict[str, float]:
    '''
    Converts an age value to the expected age range output format. This wraps
    convert_range with a date-specific parser and formatter.

    Parameters:
      ages: A representation of an age expected to be a string in one of the
        following formats:
        - "x": Single age in years.
        - "x months": Single age in months.
        - "x weeks": Single age in weeks.
        - "x - y": Age range.
        - "x -": Age range start.
        - "- y": Age range end.

    Raises:
      ValueError if the value can't be successfully parsed into an age.
    Returns:
      None: When the input value is empty.
      Dict[str, float]: When the value is present and successfully parsed. The
        dictionary in the format:
        {
          'start': float,
          'end': float
        }
        where start == end if value represents a single age.
    '''
    return convert_range(ages, parse_age, lambda x: x)


def convert_date_range(dates: str) -> Dict[str, Dict[str, str]]:
    '''
    Converts a date value to the expected date range output format. This wraps
    convert_range with a date-specific parser and formatter.

    Parameters:
      dates: A representation of date(s) expected to be a string in one of the
        following formats:
        - "dd.mm.YY": Single date.
        - "dd.mm.YY - dd.mm.YY": Date range.
        - "dd.mm.YY -": Date range start.
        - "- dd.mm.YY": Date range end.

    Raises:
      ValueError if the value can't be successfully parsed into a datetime.
    Returns:
      None: When the input value is empty.
      Dict[str, Dict[str, str]]: When the value is present and successfully
        parsed. The dictionary in the format:
        {
          'start': {
            '$date': str,
          },
          'end': {
            '$date': str
          }
        }
        where the strings are ISO 8601 date representations, and start == end if
        the value represents a single date.
    '''
    return convert_range(dates, parse_date, lambda x: {
        '$date': format_iso_8601_date(x)
    })


def convert_event(id: str, dates: Any, value: str, field_name: str, event_name: str) -> Dict[str, Any]:
    '''
    Converts a single event date column to the new event object with a name and
    range of dates.

    Parameters:
      id: The id of the input row for logging a failed conversion.
      name: The name of the event.
      dates: The value representing the date(s) of the event, to be parsed into
        a date range.

    Returns:
      None: When the input value is empty.
      Dict[str, str]: When the values are present and successfully parsed. The
        dictionary is in the format:
        {
          'name': str,
          'dateRange': {
            'start': {
              '$date': str,
            },
            'end': {
              '$date': str
            }
          }
        }
        where the date strings are ISO 8601 date representations.

    '''
    if not dates:
        return None

    try:
        event = {
            'name': str(event_name),
            'dateRange': convert_date_range(dates)
        }

        if value:
          event['value'] = value

        return event
    except ValueError as e:
        log_error(id, field_name, f'event[name="{event_name}"]', dates, e)


def convert_events(id: str, events: List[Tuple[Any, Any, str, str]]) -> List[Dict[str, Any]]:
    '''
    Converts event date columns to the new events array. Also includes the
    outcome field as an event, even though we don't have an associated date.

    Parameters:
      id: The id of the input row for logging a failed conversion.
      event_dates: A map from event name to event date.
      outcome: String representing the outcome of the case.

    Returns:
      List[Dict[str, Any]]: Always. List of events in the format:
        [{
          'name': str,
          'dateRange': {
            'start': {
              '$date': str,
            },
            'end': {
              '$date': str
            }
          }
        }]
        where the date strings are ISO 8601 date representations.
    '''
    events = [convert_event(id, i[0], i[1], i[2], i[3]) for i in events]

    # Filter out None values.
    events = [e for e in events if e]

    return events or None


def convert_demographics(id: str, age: Any, sex: str) -> Dict[str, Any]:
    '''
    Converts age and sex columns to the new demographics object.

    Parameters:
      id: The id of the input row for logging a failed conversion.

    Returns:
      Dict[str, Any]: Always. Dictionary is in the format:
        {
          'ageRange': {
            'start': {
              '$date': str,
            },
            'end': {
              '$date': str
            },
          'sex': str
        }

    '''
    demographics = {}

    try:
        converted_age = convert_age_range(age)
        if converted_age is not None:
            demographics['ageRange'] = converted_age
    except ValueError as e:
        log_error(id, 'age', 'demographics.ageRange', age, e)

    try:
        parsed_sex = parse_sex(sex)
        if parsed_sex:
            demographics['gender'] = parsed_sex
    except ValueError as e:
        log_error(id, 'sex', 'demographics.gender', age, e)

    return demographics or None


def convert_location(id: str, location: str, admin3: str, admin2: str,
                     admin1: str, country: str, geo_resolution: str,
                     latitude: float, longitude: float) -> Dict[str, Any]:
    '''
    Converts location fields to a location object.

    Parameters:
      id: The id of the input row for logging a failed conversion.

    Returns:
      Dict[str, Any]: Always. The dictionary is in the format:
        {
          'country': str,
          'administrativeAreaLevel1': str,
          'administrativeAreaLevel2': str,
          'administrativeAreaLevel3': str,
          'place': str,
          'geo_resolution': str,
          'name': str,
          'geometry': {
            'latitude': float,
            'longitude': float
          }
        }
    '''
    location = {}

    if location:
        location['place'] = str(location)

    if admin3:
        location['administrativeAreaLevel3'] = str(admin3)

    if admin2:
        location['administrativeAreaLevel2'] = str(admin2)

    if admin1:
        location['administrativeAreaLevel1'] = str(admin1)

    if country:
        location['country'] = str(country)

    geometry = {}

    try:
        parsed_latitude = parse_latitude(latitude)
        if parsed_latitude is not None:
            geometry['latitude'] = parsed_latitude
    except ValueError as e:
        log_error(id, 'latitude', 'location.latitude', latitude, e)

    try:
        parsed_longitude = parse_longitude(longitude)
        if parsed_longitude is not None:
            geometry['longitude'] = parsed_longitude
    except ValueError as e:
        log_error(id, 'longitude', 'location.longitude', longitude, e)

    if geometry:
        location['geometry'] = geometry

    # Produce a reasonable human readable name based on admin hierarchy.
    location['name'] = ', '.join([part for part in 
      [admin1, admin2, admin3]
    if part])

    try:
        parsed_geo_resolution = parse_geo_resolution(geo_resolution)
        if parsed_longitude is not None:
            location['geoResolution'] = parsed_geo_resolution
    except ValueError as e:
        log_error(id, 'geo_resolution',
                  'location.geoResolution', geo_resolution, e)

    return location


def convert_dictionary_field(id: str, field_name: str, value: str) -> Dict[
        str, List[str]]:
    '''
    Converts a list of strings into a dictionary-style field.

    Parameters:
      id: The id of the input row for logging a failed conversion.
      field_name: The name of the dictionary-style field for logging a failed
        conversion.
      value: The value to be converted.

    Returns:
      None: When the input value is empty.
      Dict[str, List[str]]: When the value is present and successfully parsed.
        The dictionary in the format:
        {
          'values': List[str]
        }
    '''
    try:
        string_list = parse_string_list(value)
        return {'values': string_list} if string_list else None
    except ValueError as e:
        log_error(id, field_name, f'{field_name}.values', value, e)


def convert_notes_field(notes_fields: [str]) -> str:
    '''
    Creates a notes field from a list of original notes fields.

    Returns:
      str: Always.
    '''
    notes = '; '.join([x for x in notes_fields if x])
    return notes or None


def convert_case_reference_field(id: str, source: str) -> Dict[str, str]:
    '''
    Converts the case reference field from the source field.

    Returns:
      None: When the input is empty.
      Dict[str, str]: When the input is nonempty. The dictionary is in the
        format:
        {
          'sourceUrl': str,
          'additionalSources': [
           {
             'sourceUrl': str
           }
          ]
        }
    '''
    if not source:
        return None

    sources = parse_list(source, ', ')

    try:
      sourceUrls = [ parse_url(source) for source in sources ]

      if not sourceUrls:
        return None
      
      caseReference = {
        'sourceUrl': sourceUrls[0],
        'verificationStatus': 'VERIFIED',
      }

      if len(sourceUrls) > 1:
        caseReference['additionalSources'] = [{
            'sourceUrl': sourceUrl
        } for sourceUrl in sourceUrls[1:]]

      return caseReference
    except ValueError as e:
       log_error(id, 'source', 'caseReference.sourceUrl', source, e)


def convert_travel_history(geocoder: Any, id: str, dates: str,
                           location: str) -> Dict[str, Any]:
    '''
    Converts the travel history date and location fields to a new travelHistory
    object.

    Parameters:
      id: The id of the input row for logging a failed conversion.

    Returns:
      None: When the input is empty or fails to parse.
      Dict[str, Any]: When the input is nonempty. The dictionary is in the
        format:
        {
          'travel': [
            'location': {...},
            'dateRange': {...}
          ]
        }
    '''
    location_list = None
    try:
        location_list = parse_location_list(geocoder, location)
    except (LookupError, ValueError) as e:
        log_error(id, 'travel_history_location',
                  'travelHistory.location', location, e)

    date_range = None
    try:
        date_range = convert_date_range(dates)
    except (ValueError) as e:
        log_error(id, 'travel_history_dates',
                  'travelHistory.dateRange', dates, e)

    if not location_list and not date_range:
        return None
    if not location_list:
        return { 'travel': [{'dateRange': date_range}] }
    if not date_range:
        return { 'travel': [{'location': l} for l in location_list if l] }

    # We believe it will be useful to have dates associated with each travel
    # location, but in the existing data, travel history only has one (or no)
    # date associated with the entire field.
    return { 'travel':
      [{'dateRange': date_range, 'location': l} for l in location_list if l]
    }


def convert_imported_case(values_to_archive: Dict[str, Any]) -> Dict[str, Any]:
    '''
    Converts original field names and values to the importedCase archival
    object.

    Returns:
      Dict[str, Any]: Always. Dictionary keys are the names of the original
        fields, and the values are the values of the original fields.
    '''
    return {k: str(v) for k, v in values_to_archive.items() if v}
