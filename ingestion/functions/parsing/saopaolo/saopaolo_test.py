import csv
import json
import os
import tempfile
import unittest
from datetime import date

import pytest

from saopaolo import saopaolo

_SOURCE_ID = "abc123"
_SOURCE_URL = "http://sao.paolo"
_PARSED_CASES = [
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "http://sao.paolo"},
        "location": {"query": "Itapevi, São Paulo, Brazil"},
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": "03/31/2020Z", "end": "03/31/2020Z"},
            }
        ],
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "http://sao.paolo"},
        "location": {"query": "Itapevi, São Paulo, Brazil"},
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": "03/31/2020Z", "end": "03/31/2020Z"},
            }
        ],
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "http://sao.paolo"},
        "location": {"query": "Itapevi, São Paulo, Brazil"},
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": "03/31/2020Z", "end": "03/31/2020Z"},
            }
        ],
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "http://sao.paolo"},
        "location": {"query": "Itapevi, São Paulo, Brazil"},
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": "03/31/2020Z", "end": "03/31/2020Z"},
            }
        ],
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "http://sao.paolo"},
        "location": {"query": "Itapevi, São Paulo, Brazil"},
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": "03/31/2020Z", "end": "03/31/2020Z"},
            }
        ],
    },
]


class SaoPaoloTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = saopaolo.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
