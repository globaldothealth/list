import os
import unittest
from scotland import scotland

_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"
_LOCATION = {
    "name": "Scotland",
    "administrativeAreaLevel1": "Scotland",
    "country": "United Kingdom",
    "geoResolution": "Admin1",
    "geometry": {
        "latitude": 56.7863,
        "longitude": -4.1140
    }
}


class ScotlandTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = scotland.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result),
                              [{'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                'events': [{'name': 'confirmed',
                                            'dateRange': {'start': '03/01/2020Z', 'end': '03/01/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 65.0, 'end': 74.0},
                                                   'gender': 'Female'},
                                'location': _LOCATION},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '03/01/2020Z', 'end': '03/01/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 45.0, 'end': 64.0}, 'gender': 'Male'},
                                  'location': _LOCATION}])
