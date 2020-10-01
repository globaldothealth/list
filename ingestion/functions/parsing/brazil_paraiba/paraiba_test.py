import os
import unittest

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
                "caseReference": {"sourceId": _SOURCE_ID, "sourceEntryId": "ymF8MCjS33", "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "João Pessoa, Paraíba, Brazil"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "04/26/2020Z",
                            "end": "04/26/2020Z"
                        },
                        "value": "Serological test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "04/16/2020Z",
                            "end": "04/16/2020Z"
                        }
                    },
                    {
                        "name": "icuAdmission",
                        "value": "Yes"
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": ["cough"]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 47.0,
                        "end": 47.0
                    }
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        "diabetes mellitus"
                    ]
                },
                "notes": "Other symptoms reported"
            }
        ])
