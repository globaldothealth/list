'''Utilities for the parsers and converters.'''

import datetime
import logging
from typing import List
from urllib.parse import urlparse
from constants import SHEET_ID_NAME_MAP


def is_url(value: str) -> bool:
    '''Returns whether the string is a URL.'''
    try:
        parts = urlparse(value)
        return parts.scheme and parts.netloc
    except Exception:
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
    return value.strftime('%Y-%m-%dT%H:%M:%SZ')


def log_error(
        id: str, old_field_name: str, new_field_name: str, value: str,
        error: Exception) -> None:
    # Split on the last dash to get (sheet_id, row_num) pairs. A couple of the
    # sheet ids have a dash within them.
    id_parts = id.rsplit('-', 1)
    sheet_id = id_parts[0]
    row_num = id_parts[1]

    logging.error('\t'.join([
                  sheet_id,
                  SHEET_ID_NAME_MAP.get(sheet_id, ''),
                  row_num,
                  old_field_name,
                  new_field_name,
                  value,
                  str(error)]))
