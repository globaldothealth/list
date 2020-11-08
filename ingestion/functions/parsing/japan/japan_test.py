import json
import os
import pytest
import tempfile
import unittest
from japan import japan


_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASES = [
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "HKD130",
            "sourceUrl": _SOURCE_URL,
            "additionalSources": [
                {
                    "sourceUrl": "https://www3.nhk.or.jp/news/html/20200313/k10012329851000.html"
                },
                {
                    "sourceUrl": "http://www.pref.hokkaido.lg.jp/file.jsp?id=1279351"
                }
            ]
        },
        "location": {
            "query": "Sapporo, Hokkaido, Japan"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "03/13/2020Z",
                            "end": "03/13/2020Z"
                        }
            },
            {
                "name": "outcome",
                "value": "Unknown"
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 50,
                "end": 59
            },
            "gender": "Female"
        },
        "notes": None
    },
    # Add a case with non-unique additional sources
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "1201",
            "sourceUrl": _SOURCE_URL,
            "additionalSources": [
                {
                    "sourceUrl": "https://www3.nhk.or.jp/news/html/20200323/k10012345631000.html"
                },
                {
                    "sourceUrl": "https://www.city.okazaki.lg.jp/houdou/p025977.html"
                },
                {
                    "sourceUrl": "https://www.pref.aichi.jp/site/covid19-aichi/pressrelease-ncov200323.html"
                }
            ]
        },
        "location": {
            "query": "Okazaki, Aichi, Japan"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "03/23/2020Z",
                            "end": "03/23/2020Z"
                        }
            },
            {
                "name": "outcome",
                "dateRange":
                        {
                            "start": "03/23/2020Z",
                            "end": "03/23/2020Z"
                        },
                "value": "Death"
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 80,
                "end": 89
            },
            "gender": "Male"
        },
        "notes": None
    }
]


class JapanTest(unittest.TestCase):
    def test_parse(self):
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.json")

        result = japan.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)