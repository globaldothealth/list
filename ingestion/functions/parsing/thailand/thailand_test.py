import os
import unittest

from thailand import thailand


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
            "gender": "Male",
            "nationalities": [
                "Thai"
            ]
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
            "gender": "Female",
            "nationalities":[
                "Burmese"
            ]
        },
        "notes": 'Case was not in quarantine',
    },
    {
        'caseReference': {
            'sourceId': 'abc123',
            'sourceEntryId': '3219',
            'sourceUrl': 'https://foo.bar'
        },
        'location': {'query': 'เมือง, ไม่พบข้อมูล, Thailand'},
        'events': [
            {'name': 'confirmed', 'dateRange': {
                'start': '07/13/2020Z', 'end': '07/13/2020Z'}}
        ],
        'demographics': {
            'ageRange': {'start': 43.0, 'end': 43.0},
            'gender': 'Male',
            "nationalities": [
                "Thai",
                "Indian"
            ]
        },
        'notes': 'Case was in quarantine'
    },
]


class ThailandTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.json")

        result = thailand.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
