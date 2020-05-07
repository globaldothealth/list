'''Utilities for the parsers and converters.'''

import datetime
import logging
from typing import List
from urllib.parse import urlparse


def is_url(value: str) -> bool:
    '''Returns whether the string is a URL.'''
    try:
        parts = urlparse(value)
        return parts.scheme and parts.netloc
    except:
        return False


def trim_string_list(values: List[str]) -> List[str]:
    '''
    Removes extra whitespace, duplicates, and empty string values from a
    list of strings.
    '''
    # Remove whitespace that might surround the delimiter ('cough, fever').
    values = [x.strip() for x in values]

    # Remove empty strings that can result from trailing delimiters ('cough,').
    values = [str(i) for i in values if i]

    # Remove duplicate values (stable).
    deduped = []
    [deduped.append(x) for x in values if x not in deduped]
    return deduped


def format_iso_8601_date(value: datetime) -> str:
    '''Formats a datetime into an ISO 8601 string.'''
    return value.strftime('%Y-%m-%dT%H:%M:%SZ')


def warn(id: str, field_name: str, value: str, error: Exception) -> None:
    logging.warning('[%s] [%s] "%s": %s', id, field_name, value, error)
