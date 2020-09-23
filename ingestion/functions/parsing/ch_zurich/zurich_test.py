import os
import unittest

from ch_zurich import zurich

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://gd.zh.ch/internet/gesundheitsdirektion/de/themen/coronavirus.html"
_PARSED_CASES = [
    {
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
                "longitude": "8.651071",
                "latitude": "47.42568",
            },
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "02/24/2020Z",
                            "end": "02/24/2020Z",
                        },
            },
        ],
        "demographics": {
            "ageRange": {
                "start": 0,
                "end": 9,
            },
            "gender": "Female",
        },
    }, {
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
                "longitude": "8.651071",
                "latitude": "47.42568",
            },
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "02/24/2020Z",
                            "end": "02/24/2020Z",
                        },
            },
        ],
        "demographics": {
            "ageRange": {
                "start": 0,
                "end": 9,
            },
            "gender": "Male",
        },
    }, {
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
                "longitude": "8.651071",
                "latitude": "47.42568",
            },
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "02/24/2020Z",
                            "end": "02/24/2020Z",
                        },
            },
        ],
        "demographics": {
            "ageRange": {
                "start": 100,
                "end": 120,
            },
            "gender": "Female",
        },
    }, {
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
                "longitude": "8.651071",
                "latitude": "47.42568",
            },
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "03/09/2020Z",
                            "end": "03/09/2020Z",
                        },
            },
        ],
        "demographics": {
            "ageRange": {
                "start": 60,
                "end": 69,
            },
        },
    },
]


class CHZurichTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = zurich.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
