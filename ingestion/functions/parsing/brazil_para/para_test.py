import os
import unittest

from brazil_para import para

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class ParaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = para.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceEntryId": "fbWC81cdgZ", "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "Belém, Pará, Brazil"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "05/22/2020Z",
                            "end": "05/22/2020Z"
                        },
                        "value": "Serological test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "04/16/2020Z",
                            "end": "04/16/2020Z"
                        }
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": ["fever", "cough"]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 41.0,
                        "end": 41.0
                    }
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        "heart disease"
                    ]
                },
                "notes": "Other symptoms reported"
            }
        ])
