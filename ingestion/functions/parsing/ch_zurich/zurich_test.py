import json
import csv
import os
import pytest

import tempfile

from ch_zurich import zurich

from datetime import date

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://gd.zh.ch/internet/gesundheitsdirektion/de/themen/coronavirus.html"
_PARSED_CASE = (
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL
        },
        "location": {
            "country": "Switzerland",
            "administrativeAreaLevel1": "Zurich",
            "geoResolution": "Admin1",
            "geometry": {
                "longitude": "8.651071",
                "latitude": "47.42568"
            }
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "02/27/2020Z",
                            "end": "02/27/2020Z"
                        }
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 33,
                "end": 33
            },
            "gender": "Female"
        },
    })

import unittest

class CHZurichTest(unittest.TestCase):
    def test_parse(self):
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = zurich.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(result, [_PARSED_CASE, _PARSED_CASE])
