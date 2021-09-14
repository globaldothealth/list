import os
import unittest

from ch_zurich import zurich

_SOURCE_ID = "abc123"
_SOURCE_URL = (
    "https://gd.zh.ch/internet/gesundheitsdirektion/de/themen/coronavirus.html"
)


def _c(confirmed_date, gender, age_start, age_end):
    c = {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
        },
        "location": {
            "country": "Switzerland",
            "administrativeAreaLevel1": "Zurich",
            "geoResolution": "Admin1",
            "name": "Zurich canton",
            "geometry": {
                "longitude": 8.651071,
                "latitude": 47.42568,
            },
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": confirmed_date, "end": confirmed_date},
            },
        ],
        "demographics": {
            "ageRange": {
                "start": age_start,
                "end": age_end,
            },
        },
    }
    if gender:
        c["demographics"]["gender"] = gender
    return c


_PARSED_CASES = [
    _c("02/24/2020Z", "Female", 0, 9),
    _c("02/24/2020Z", "Male", 0, 9),
    _c("02/24/2020Z", "Female", 100, 120),
    _c("03/09/2020Z", None, 60, 69),
    _c("03/09/2020Z", "Male", 42, 42),
]


class CHZurichTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = zurich.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
