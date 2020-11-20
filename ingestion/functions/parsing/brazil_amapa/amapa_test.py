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

        expected_case = {
            "caseReference": {
                "sourceId": _SOURCE_ID,
                "sourceUrl": _SOURCE_URL
            },
            "location": {
                "query": "Ferreira Gomes, Amapá, Brazil"
            },
            "demographics": {
                "gender": "Male",
                "ageRange":
                {
                    "start": float(52),
                    "end": float(52)
                },
                "ethnicity": "Mixed",
                "occupation": None
            },
            "events": [
                {
                    "name": "confirmed",
                    "dateRange":
                    {
                        "start": "06/04/2020Z",
                        "end": "06/04/2020Z"
                    },
                    "value": "Serological test"
                },
                {
                    "name": "outcome",
                    "value": "Recovered"
                }
            ],
            "preexistingConditions": {
                "hasPreexistingConditions": True,
                "values": ["diabetes mellitus"]
            },
            "notes": "Patient with immunosupression, Neighbourhood: FERREIRA GOMES"
        }

        result = amapa.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            expected_case,
            expected_case
        ])

    def test_drop_broken_date(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "broken_date.csv")

        result = amapa.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [])
