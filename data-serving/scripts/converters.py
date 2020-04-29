
import datetime
import logging
import math
import numbers
from typing import Any, Dict, List

'''Library of conversion functions for converting CSV line-list data to json.'''

def convert_to_events(id: str, dates: str, outcome: str) -> List[Dict[str, Any]]:
    '''
    Converts event date columns to the new events array. Also includes the outcome field as an event, even though we don't have an associated date.
    '''
    events = []

    for key in dates:
        try:
            date = datetime.datetime.strptime(
                dates[key], '%d.%m.%Y').date()
            events.append({
                'name': key,
                'date': {
                    '$date': date.strftime('%Y-%m-%dT%H:%M:%SZ')
                }
            })
        except (TypeError, ValueError):
            logging.warning(
                '[%s] [eventSequence.%s] value error %s', id, key, dates[key])

    if outcome and type(outcome) is str:
        events.append({'name': outcome})

    return events

validSexes = ['female', 'male', 'other']
def convert_to_demographics(id: str, age: str, sex: str) -> Dict[str, Any]:
    ''' Converts age and sex columns to the new demographics object. '''

    demographics = {}

    try:
        ageFloat = float(age)
        # Without the below, it prints null in the JSON
        if not math.isnan(ageFloat):
            demographics['age'] = {
                'years': ageFloat
            }
    except ValueError:
        logging.warning('[%s] [demographics.age] value error %s', id, age)

    if str(sex).lower() in validSexes:
        demographics['sex'] = str(sex).capitalize()

    return demographics