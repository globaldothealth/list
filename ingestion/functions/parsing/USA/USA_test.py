import os
import unittest
from USA import USA

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://data.cdc.gov/api/views/vbim-akqf/rows.csv?accessType=DOWNLOAD"


class USATest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = USA.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {
                    "sourceId": "abc123",
                    "sourceUrl": "https://data.cdc.gov/api/views/vbim-akqf/rows.csv?accessType=DOWNLOAD",
                },
                "location": {"query": "United States"},
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {"start": "08/30/2020Z", "end": "08/30/2020Z"},
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {"start": "08/30/2020Z", "end": "08/30/2020Z"},
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic"
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {"start": 20.0, "end": 29.0},
                    "ethnicity": "White, Non-Hispanic"
                },
                "preexistingConditions": {"hasPreexistingConditions": True}
            }
        ])
