import os
import unittest

from brazil_acre import acre

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class AcreTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = acre.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceEntryId": "3691", "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "Rio Branco, Acre, Brazil"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "05/20/2020Z",
                            "end": "05/20/2020Z"
                        },
                        "value": "PCR test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "05/14/2020Z",
                            "end": "05/14/2020Z"
                        }
                    },
                    {
                        "name": "outcome",
                        "value": "Recovered"
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": ["throat pain", "dyspnea", "cough"]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 31.0,
                        "end": 31.0
                    },
                    "ethnicity": "Asian",
                    "occupation": "Healthcare worker"
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        "respiratory system disease", "heart disease"
                    ]
                },
                "notes": "Other symptoms reported"
            }
        ])
