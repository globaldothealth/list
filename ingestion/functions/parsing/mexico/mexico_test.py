import os
import unittest

from mexico import mexico

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://mex.ico"
_PARSED_CASE = {
    "caseReference": {"sourceId": "abc123", "sourceUrl": "https://mex.ico"},
    "location": {"query": "MÉXICO, ATIZAPÁN DE ZARAGOZA, MEXICO"},
    "events": [
        {
            "name": "confirmed",
            "dateRange": {"start": "04/28/2020Z", "end": "04/28/2020Z"},
        },
        {
            "name": "hospitalAdmission",
            "dateRange": {"start": "04/28/2020Z", "end": "04/28/2020Z"},
            "value": "Yes",
        },
        {
            "name": "outcome",
            "dateRange": {"start": "05/09/2020Z", "end": "05/09/2020Z"},
            "value": "Death",
        },
    ],
    "demographics": {
        "gender": "Male",
        "ageRange": {"start": 56.0, "end": 56.0},
        "nationalities": "Mexican",
    },
    "preexistingConditions": {"values": ["obesity"]},
    "notes": "Smoker",
}


class MexicoTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = mexico.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertEqual(next(result), _PARSED_CASE)
