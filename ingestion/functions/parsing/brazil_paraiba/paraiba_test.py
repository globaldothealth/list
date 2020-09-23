import csv
import json
import os
import tempfile
import unittest
from datetime import date

import pytest

from brazil_paraiba import paraiba

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"

class ParaibaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = paraiba.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceUrl": _SOURCE_URL
                },
                "location": {
                    "query": "Santa Rita, Paraíba, Brazil"
                    },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                                "start": 80.0,
                                "end": 80.0
                                },
                },
                "events": [
                    {
                        "name": "confirmed",
                        "value": "PCR test"
                    },
                    {
                        "name" : "onsetSymptoms",
                        "dateRange":
                        {
                            "start": "04/27/2020Z",
                            "end": "04/27/2020Z"
                        },                      
                    },
                    {
                        "name" : "outcome",
                        "dateRange":
                        {
                            "start": "05/10/2020Z",
                            "end": "05/10/2020Z"
                        }, 
                        "value" : "Death"                       
                    }
                ],
                "preexistingConditions": {
                                            "hasPreexistingConditions": True,
                                            "values":
                                            ["diabetes mellitus", "heart disease", "respiratory system disease"]
                                        },
                "notes": ''
            }
        ])
