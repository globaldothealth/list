import os
import unittest

from brazil_ceara import ceara

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class CearaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = ceara.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceEntryId": "z5OztE51HE", "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "Tauá, Ceará, Brazil"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "08/10/2020Z",
                            "end": "08/10/2020Z"
                        },
                        "value": "Serological test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "08/10/2020Z",
                            "end": "08/10/2020Z"
                        }
                    },
                    {
                        "name": "outcome",
                        "value": "Recovered"
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": ["fever", "cough"]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 71.0,
                        "end": 71.0
                    }
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        "diabetes mellitus",
                        "respiratory system disease",
                        "chronic kidney disease"
                    ]
                },
                "notes": "Primary immunodeficiency disease or chromosomal disease, Other symptoms reported"
            }
        ])
