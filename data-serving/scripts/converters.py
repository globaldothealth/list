'''Library of conversion functions for converting CSV line-list data to json.'''

import datetime
import logging
import math
import numbers
import pandas as pd
import re
from constants import VALID_SEXES
from pandas import Series
from typing import Any, Callable, Dict, List


def trim_string_array(values: List[str]) -> List[str]:
    # Remove whitespace that might surround the delimiter ('cough, fever')
    values = [x.strip() for x in values]

    # Remove empty strings that can result from trailing delimiters ('cough,')
    values = [str(i) for i in values if i]

    # Remove duplicate values
    return list(set(values))


def convert_range(
        value: str, parse_fn: Callable[[str],
                                       str],
        format_fn: Callable[[Any],
                            Any]) -> Dict[str, Any]:
    '''
    Converts either a string representation of a single value or a range of
    values into a range object. The values can be of any types using the custom
    parse and format functions.
    '''
    if pd.isna(value):
        return None

    # First check if the value is represented as a range.
    if type(value) is str and value.find('-') >= 0:
        value_range = trim_string_array(value.split('-'))

        # Handle open ranges (i.e. missing min or max).
        first_val = parse_fn(value_range[0])
        if len(value_range) == 1:
            return {
                'end': format_fn(first_val)

            } if value.startswith('-') else {
                'start': format_fn(first_val)
            }

        # Handle cases with a min and max.
        second_val = parse_fn(value_range[1])
        return {
            'start': format_fn(first_val),
            'end': format_fn(second_val)

        }

    # We have a specific value. We create a range with identical min and max
    # values.
    parsed_value = parse_fn(value)
    return {
        'start': format_fn(parsed_value),
        'end': format_fn(parsed_value)
    }


def convert_event(id: str, name: str, date_str: str) -> Dict[str, str]:
    '''
    Converts a single event date column to the new event object with a name and
    range of dates.
    '''
    if pd.isna(date_str):
        return None

    try:
        date_range = convert_range(
            date_str,
            lambda x: datetime.datetime.strptime(x, '%d.%m.%Y'),
            lambda x: {
                '$date': x.strftime('%Y-%m-%dT%H:%M:%SZ')
            })

        return {
            'name': str(name),
            'dateRange': date_range
        }
    except (TypeError, ValueError):
        logging.warning(
            '[%s] [event[name=%s]] invalid value %s', id, name, date_str)


def convert_events(id: str, dates: str, outcome: str) -> List[Dict[str, Any]]:
    '''
    Converts event date columns to the new events array. Also includes the
    outcome field as an event, even though we don't have an associated date.
    '''
    events = list(map(lambda i: convert_event(
        id, i[0], i[1]), dates.items()))

    # The old data model had an outcome string, which will become an event in
    # the new data model, but it won't have a date associated with it.
    if outcome and type(outcome) is str:
        events.append({'name': str(outcome)})

    # Filter out None values.
    return [e for e in events if e]


def parse_age(age: str) -> float:
    if type(age) is str:
        # Convert ages in the format of "x month(s)" to floats
        num_months = re.findall(r'(\d+)\smonth', age)
        if num_months:
            return int(num_months[0]) / 12

        # Convert ages in the format "x week(s)" to floats
        num_weeks = re.findall(r'(\d+)\sweek', age)
        if num_weeks:
            return int(num_weeks[0]) / 52

    return float(age)


def convert_age(id: str, age: str) -> Dict[str, Any]:
    '''Converts age column to the new demographics.age object. '''
    try:
        age_range = convert_range(age, parse_age, lambda x: x)

        if not age_range:
            return None
        if 'start' in age_range and(
                age_range['start'] < -1 or age_range['start'] > 300):
            raise ValueError('age_range.start outside of valid range')
        if 'end' in age_range and(
                age_range['end'] < -1 or age_range['end'] > 300):
            raise ValueError('age_range.end outside of valid range')

        return age_range
    except ValueError:
        logging.warning('[%s] [demographics.age] value error %s', id, age)


def convert_sex(id: str, sex: str) -> str:
    if pd.isna(sex):
        return None

    try:
        if str(sex).lower() not in VALID_SEXES:
            raise ValueError('sex not in enum')

        return str(sex).capitalize()
    except ValueError:
        logging.warning('[%s] [demographics.sex] value error %s', id, age)


def convert_demographics(id: str, age: str, sex: str) -> Dict[str, Any]:
    '''Converts age and sex columns to the new demographics object. '''
    demographics = {}

    converted_age = convert_age(id, age)
    if converted_age:
        demographics['ageRange'] = converted_age

    converted_sex = convert_sex(id, sex)
    if converted_sex:
        demographics['sex'] = converted_sex

    demographics['species'] = 'Homo sapien'

    # If the dictionary is empty, we want to omit it from the JSON output
    return demographics if demographics else None


def convert_location(id: str, country: str, adminL1: str,
                     adminL2: str, locality: str, latitude: float,
                     longitude: float) -> Dict[str, Any]:
    '''Converts location fields to a location object.'''
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
        if pd.notna(latitude):
            normalized_latitude = float(latitude)

            if normalized_latitude < -90 or normalized_latitude > 90:
                raise ValueError('latitude outside of valid range')

            geometry['latitude'] = normalized_latitude
    except (TypeError, ValueError):
        logging.warning(
            '[%s] [location.latitude] invalid value %s', id, latitude)

    try:
        if pd.notna(longitude):
            normalized_longitude = float(longitude)

            if normalized_longitude < -180 or normalized_latitude > 180:
                raise ValueError('longitude outside of valid range')

            geometry['longitude'] = normalized_longitude
    except (TypeError, ValueError):
        logging.warning(
            '[%s] [location.longitude] invalid value %s', id, longitude)

    if geometry:
        location['geometry'] = geometry

    return location


def convert_dictionary_field(
        id: str, field_name: str, value: str) -> Dict[
        str, List[str]]:
    if pd.isna(value):
        return None
    if type(value) is not str:
        logging.warning(
            '[%s] [field_name] invalid value %s', id, value)
        return None

    is_comma_delimited = value.find(',') >= 0
    is_colon_delimited = value.find(':') >= 0

    if is_comma_delimited:
        if is_colon_delimited:
            logging.warning(
                '[%s] [field_name] two delimiters detected, using comma %s', id,
                value)

        return {'provided': trim_string_array(value.split(','))}
    if is_colon_delimited:
        return {'provided': trim_string_array(value.split(':'))}

    # Assuming this wasn't a list, but a singular value.
    return {'provided': [value]}


def convert_revision_metadata_field(data_moderator_initials: str) -> Dict[
        str, str]:
    '''
    Populates a revisionMetadata field with an initial revision version of 0 and
    the data moderator's initials where available.
    '''
    revision_metadata = {
        'id': 0
    }

    if pd.notna(data_moderator_initials):
        revision_metadata['moderator'] = data_moderator_initials

    return revision_metadata


def convert_notes_field(notes_fields: [str]) -> Dict[str, Any]:
    '''Creates a notes field from up to a list of original notes fields '''
    notes = '; '.join([x for x in notes_fields if pd.notna(x)])

    return notes if notes else None


def convert_imported_case(values_to_archive: Series) -> Dict[str, Any]:
    '''
    Converts original field names and values to the importedCase archival
    object.
    '''
    return {k: str(v) for k, v in values_to_archive.iteritems()
            if pd.notna(v)}
