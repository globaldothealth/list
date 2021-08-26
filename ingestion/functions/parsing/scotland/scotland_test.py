import os
import unittest
from pprint import pprint
from scotland import scotland

_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"
_LOCATION = {
    "name": "Scotland",
    "administrativeAreaLevel1": "Scotland",
    "country": "United Kingdom",
    "geoResolution": "Admin1",
    "geometry": {"latitude": 56.7863, "longitude": -4.1140},
}


def _c(confirmed_date, gender, age_start, age_end):
    return {
        "caseReference": {
            "sourceId": "placeholder_ID",
            "sourceUrl": "placeholder_URL",
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": confirmed_date, "end": confirmed_date},
            }
        ],
        "demographics": {
            "ageRange": {"start": age_start, "end": age_end},
            "gender": gender,
        },
        "location": _LOCATION,
    }


_PARSED_CASES = [
    _c("03/01/2020Z", "Female", 65, 74),
    _c("03/01/2020Z", "Female", 85, 120),
    _c("03/01/2020Z", "Male", 45, 64),
]


class ScotlandTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = list(scotland.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL))
        self.assertCountEqual(result, _PARSED_CASES)
