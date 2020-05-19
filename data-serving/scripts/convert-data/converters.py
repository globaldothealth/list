'''
Library of conversion functions for converting CSV line-list data to json.

The converters are specifically responsible for converting the input fields to
the new format; they call parsers as necessary to parse typed values from input
strings and then format them to match the output schema.

Converters log errors thrown by the parsers, since they have the context on
which row failed to convert.
'''

import pandas as pd
from parsers import (parse_age, parse_bool, parse_date,
                     parse_latitude, parse_location, parse_longitude,
                     parse_range, parse_sex, parse_string_list)
from pandas import Series
from typing import Any, Callable, Dict, List
from utils import format_iso_8601_date, is_url, warn


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


def convert_event(id: str, name: str, dates: Any) -> Dict[str, Any]:
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
      Dict[str, str]: When the values are present and succesfully parsed. The
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
    if pd.isna(dates):
        return None

    try:
        return {
            'name': str(name),
            'dateRange': convert_date_range(dates)
        }
    except ValueError as e:
        warn(id, f'event[name="{name}"]', dates, e)


def convert_events(id: str, event_dates: Dict[str, Any],
                   outcome: str) -> List[Dict[str, Any]]:
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
    events = list(map(lambda i: convert_event(
        id, i[0], i[1]), event_dates.items()))

    # The old data model had an outcome string, which will become an event in
    # the new data model, but it won't have a date associated with it.
    if pd.notna(outcome):
        events.append({'name': str(outcome)})

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
          'sex': str,
          'species': str
        }

    '''
    demographics = {}

    try:
        converted_age = convert_age_range(age)
        if converted_age is not None:
            demographics['ageRange'] = converted_age
    except ValueError as e:
        warn(id, 'demographics.ageRange', age, e)

    try:
        parsed_sex = parse_sex(sex)
        if parsed_sex:
            demographics['sex'] = parsed_sex
    except ValueError as e:
        warn(id, 'demographics.sex', age, e)

    return demographics or None


def convert_location(id: str, country: str, adminL1: str,
                     adminL2: str, locality: str, latitude: float,
                     longitude: float) -> Dict[str, Any]:
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
          'locality': str,
          'geometry': {
          'latitude': float,
          'longitude': float
          }
        }
    '''
    location = {}

    if pd.notna(country):
        location['country'] = str(country)

    if pd.notna(adminL1):
        location['administrativeAreaLevel1'] = str(adminL1)

    if pd.notna(adminL2):
        location['administrativeAreaLevel2'] = str(adminL2)

    if pd.notna(locality):
        location['locality'] = str(locality)

    geometry = {}

    try:
        parsed_latitude = parse_latitude(latitude)
        if parsed_latitude is not None:
            geometry['latitude'] = parsed_latitude
    except ValueError as e:
        warn(id, 'location.latitude', latitude, e)

    try:
        parsed_longitude = parse_longitude(longitude)
        if parsed_longitude is not None:
            geometry['longitude'] = parsed_longitude
    except ValueError as e:
        warn(id, 'location.longitude', longitude, e)

    if geometry:
        location['geometry'] = geometry

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
          'provided': List[str]
        }
    '''
    try:
        string_list = parse_string_list(value)
        return {'provided': string_list} if string_list else None
    except ValueError as e:
        warn(id, 'field_name.provided', value, e)


def convert_revision_metadata_field(data_moderator_initials: str) -> Dict[
        str, str]:
    '''
    Populates a revisionMetadata field with an initial revision number of 0 and
    the data moderator's initials where available.

    Returns:
      Dict[str, str]: Always. The dictionary is in the format:
        {
          'id': int,
          'moderator': str
        }
    '''
    revision_metadata = {
        'id': 0
    }

    if pd.notna(data_moderator_initials):
        revision_metadata['moderator'] = str(data_moderator_initials)

    return revision_metadata


def convert_notes_field(notes_fields: [str]) -> str:
    '''
    Creates a notes field from a list of original notes fields.

    Returns:
      str: Always.
    '''
    notes = '; '.join([x for x in notes_fields if pd.notna(x)])
    return notes or None


def convert_source_field(source: str) -> Dict[str, str]:
    '''
    Converts the source field to a new source object that has either a URL or
    an unknown reference type.

    Returns:
      None: When the input is empty.
      Dict[str, str]: When the input is nonempty. The dictionary is in the
        format:
        {
          'url': str,
          'other': str
        }
    '''
    if pd.isna(source):
        return None

    return {
        'url': source
    } if is_url(source) else {
        'other': str(source)
    }


def convert_pathogens_field(sequence: str) -> List[Dict[str, Any]]:
    '''
    Converts the sequence field to an array of pathogens that may have sequence
    source data.

    Returns:
      List[Dict[str, Any]]: Always. The output is in the format:
        [{
          'name': str,
          'sequenceSource': {
            'url': str,
            'other': str
          }
        }]
    '''
    cov_pathogen = {
        'name': 'sars-cov-2'
    }

    source = convert_source_field(sequence)
    if source:
        cov_pathogen['sequenceSource'] = source

    return [cov_pathogen]


def convert_outbreak_specifics(id: str, reported_market_exposure: str,
                               lives_in_wuhan: str) -> Dict[str, bool]:
    '''
    Converts the covid-19-specific fields into a new outbreakSpecifics
    object.

    Parameters:
      id: The id of the input row for logging a failed conversion.

    Returns:
      None: When the input is empty.
      Dict[str, bool]: When the input is nonempty. The dictionary is in the
        format:
        {
          'reportedMarketExposure': bool,
          'livesInWuhan': bool
        }
    '''

    outbreak_specifics = {}

    try:
        normalized = parse_bool(reported_market_exposure)
        if normalized is not None:
            outbreak_specifics['reportedMarketExposure'] = normalized
    except ValueError as e:
        warn(
            id, 'outbreakSpecifics.reportedMarketExposure',
            reported_market_exposure, e)

    try:
        normalized = parse_bool(lives_in_wuhan)
        if normalized is not None:
            outbreak_specifics['livesInWuhan'] = normalized
    except ValueError as e:
        warn(id, 'outbreakSpecifics.livesInWuhan', lives_in_wuhan, e)

    return outbreak_specifics or None


def convert_travel_history(id: str, dates: str, location: str) -> Dict[
        str, Any]:
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
          'location': {...},
          'dateRange': {...}
        }
    '''
    travel_history = {}

    try:
        parsed_location = parse_location(location)
        if parsed_location:
            travel_history['location'] = parsed_location
    except (LookupError, ValueError) as e:
        warn(id, 'travelHistory.location', location, e)

    # It's invalid to have dates without a location; only convert the rest of
    # the field (i.e. the dates) if location was successfully parsed.
    if not travel_history.get('location'):
        return None

    try:
        date_range = convert_date_range(dates)
        if date_range:
            travel_history['dateRange'] = date_range
    except (TypeError, ValueError) as e:
        warn(id, 'travelHistory.dateRange', dates, e)

    return [travel_history] if travel_history else None


def convert_imported_case(values_to_archive: Series) -> Dict[str, Any]:
    '''
    Converts original field names and values to the importedCase archival
    object.

    Returns:
      Dict[str, Any]: Always. Dictionary keys are the names of the original
        fields, and the values are the values of the original fields.
    '''
    return {k: str(v) for k, v in values_to_archive.iteritems()
            if pd.notna(v)}
