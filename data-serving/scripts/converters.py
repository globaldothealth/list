'''Library of conversion functions for converting CSV line-list data to json.'''

import datetime
import logging
import math
import numbers
import pandas as pd
from constants import VALID_SEXES
from pandas import Series
from typing import Any, Callable, Dict, List


def convert_range(
        value: str, parse_fn: Callable[[str],
                                       str],
        format_fn: Callable[[Any],
                            Any]):
    '''
    Converts either a string representation of a single value or a range of
    values into a range object. The values can be of any types using the custom
    parse and format functions.
    '''
    if pd.isna(value):
        return None

    # First check if the value is represented as a range.
    if type(value) is str and value.find('-') >= 0:
        value_range = value.split('-')
        # Remove whitespace that might surround the dash ('23 - 72')
        value_range = [x.strip() for x in value_range]
        # Remove empty strings that can result from open ranges ('18-')
        value_range = [i for i in value_range if i]

        # Handle open ranges (i.e. missing min or max).
        range_min = parse_fn(value_range[0])
        if len(value_range) == 1:
            return {
                'range': {
                    'max': format_fn(range_min)
                }
            } if value.startswith('-') else {
                'range': {
                    'min': format_fn(range_min)
                }
            }

        # Handle cases with a min and max.
        range_max = parse_fn(value_range[1])
        return {
            'range': {
                'min': format_fn(range_min),
                'max': format_fn(range_max)
            }
        }

    # We have a specific value. We create a range with identical min and max
    # values.
    parsed_value = parse_fn(value)
    return {
        'range': {
            'min': format_fn(parsed_value),
            'max': format_fn(parsed_value)
        }
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
            'name': name,
            'date': date_range
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
        events.append({'name': outcome})

    # Filter out None values.
    return [e for e in events if e]


def convert_age(id: str, age: str) -> Dict[str, Any]:
    '''Converts age column to the new demographics.age object. '''
    try:
        return convert_range(age, float, lambda x: x)
    except ValueError:
        logging.warning('[%s] [demographics.age] value error %s', id, age)


def convert_demographics(id: str, age: str, sex: str) -> Dict[str, Any]:
    '''Converts age and sex columns to the new demographics object. '''
    demographics = {}

    converted_age = convert_age(id, age)
    if converted_age:
        demographics['age'] = converted_age

    if str(sex).lower() in VALID_SEXES:
        demographics['sex'] = str(sex).capitalize()

    # If the dictionary is empty, we want to omit it from the JSON output
    return demographics if demographics else None


def convert_location(id: str, location_id: float, country: str, adminL1: str,
                     adminL2: str, locality: str, latitude: float,
                     longitude: float) -> Dict[str, Any]:
    '''Converts location fields to a location object.'''
    location = {}

    try:
        if pd.notna(location_id):
            location['id'] = float(location_id)
    except (TypeError, ValueError):
        logging.warning(
            '[%s] [location.id] invalid value %s', id, location_id)

    if pd.notna(country):
        location['country'] = country

    if pd.notna(adminL1):
        location['administrativeAreaLevel1'] = adminL1

    if pd.notna(adminL2):
        location['administrativeAreaLevel2'] = adminL2

    if pd.notna(locality):
        location['locality'] = locality

    geometry = {}

    try:
        if pd.notna(latitude):
            geometry['latitude'] = float(latitude)
    except (TypeError, ValueError):
        logging.warning(
            '[%s] [location.latitude] invalid value %s', id, latitude)

    try:
        if pd.notna(longitude):
            geometry['longitude'] = float(longitude)
    except (TypeError, ValueError):
        logging.warning(
            '[%s] [location.longitude] invalid value %s', id, longitude)

    if geometry:
        location['geometry'] = geometry

    return location


def convert_imported_case(id: str, values_to_archive: Series) -> Dict[str, Any]:
    '''
    Converts original field names and values to the importedCase archival
    object.
    '''
    return {k: v for k, v in values_to_archive.iteritems()
            if pd.notna(v)}
