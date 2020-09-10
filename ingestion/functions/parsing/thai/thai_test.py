import json
import os
import pytest
import tempfile
import unittest

from datetime import date

from thai import thai


_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASES = [
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            'sourceEntryId': '3445',
            "sourceUrl": _SOURCE_URL
        },
        "location": {'query': 'ราชเทวี, Bangkok, Thailand'},
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "09/07/2020Z",
                            "end": "09/07/2020Z"
                        }
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 27.0,
                "end": 27.0
            },
            "gender": "Male"
        },
        "notes": 'Case was in quarantine',
    },
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            'sourceEntryId': '2999',
            "sourceUrl": _SOURCE_URL
        },
        "location": {'query': 'สะเดา, Songkhla, Thailand'},
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "05/08/2020Z",
                            "end": "05/08/2020Z"
                        }
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 30.0,
                "end": 30.0
            },
            "gender": "Female"
        },
        "notes": 'Case was not in quarantine',
    },
]


class ThaiTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.json")

        result = thai.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
