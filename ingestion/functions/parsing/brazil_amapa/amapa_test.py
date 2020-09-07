import csv
import json
import os
import tempfile
import unittest
from datetime import date

import pytest

from brazil_amapa import amapa

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"

class AmapaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = amapa.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(result, [
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceUrl": _SOURCE_URL
                },
                "location": {
                    "query": "Laranjal do Jari, Amapá, Brazil"
                    },
                "demographics": {
                    "gender": "Female",
                    "ageRange": 
                    {
                        "start": float(54),
                        "end": float(54)
                    },
                    "ethnicity": "Mixed",
                    "occupation": None
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": "2020-04-22T03:00:00.000Z",
                            "end": "2020-04-22T03:00:00.000Z"
                        },
                        "value": "Serological test"
                    },
                ],
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": ["diabetes mellitus", "pregnancy", "heart disease"]
                    },
                "notes": "Neighbourhood: AGRESTE"
            }
        ])