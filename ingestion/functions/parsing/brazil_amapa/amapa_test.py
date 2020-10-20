import os
import unittest

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
        self.assertCountEqual(list(result), [
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
                            "start": "04/22/2020Z",
                            "end": "04/22/2020Z"
                        },
                        "value": "Serological test"
                    },
                ],
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": ["diabetes mellitus", "heart disease"]
                },
                "notes": "Neighbourhood: AGRESTE"
            }
        ])

    def test_drop_broken_date(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "broken_date.csv")

        result = amapa.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [])

