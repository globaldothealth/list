import os
import unittest

from taiwan import taiwan

_SOURCE_ID = "abc123"
_SOURCE_URL = "some-source-url"

_Changhua = {
    "administrativeAreaLevel1": "Changhua County",
    "country": "Taiwan",
    "geoResolution": "Admin1",
    "geometry": {
      "latitude": 24.0755667,
      "longitude": 120.5444667
    },
    "name": "Changhua County"
}


_PARSED_CASES = [
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
        },
        'location': taiwan.TAIWAN_LOCATION,
        'events': [
            {
                'name': 'confirmed',
                'dateRange': {'start': '01/22/2020Z', 'end': '01/22/2020Z'},
            },
        ],
        'demographics': {
            'gender': 'Female',
            'ageRange': {'start': 55, 'end': 59},
        },
        "travelHistory": {
            "traveledPrior30Days": True
        },
    }, {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
        },
        'location': taiwan.TAIWAN_LOCATION,
        'events': [
            {
                'name': 'confirmed',
                'dateRange': {'start': '01/22/2020Z', 'end': '01/22/2020Z'},
            },
        ],
        'demographics': {
            'gender': 'Female',
            'ageRange': {'start': 55, 'end': 59},
        },
        "travelHistory": {
            "traveledPrior30Days": True
        },
    }, {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
        },
        'location': _Changhua,
        'events': [
            {
                'name': 'confirmed',
                'dateRange': {'start': '01/24/2020Z', 'end': '01/24/2020Z'},
            },
        ],
        'demographics': {
            'gender': 'Male',
            'ageRange': {'start': 55, 'end': 55},
        },
        "travelHistory": None
    }, {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
        },
        'location': _Changhua,
        'events': [
            {
                'name': 'confirmed',
                'dateRange': {'start': '01/24/2020Z', 'end': '01/24/2020Z'},
            },
        ],
        'demographics': {
            'gender': 'Male',
            'ageRange': {'start': 70, 'end': 120},
        },
        "travelHistory": None
    },
]


class TaiwanTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = taiwan.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
