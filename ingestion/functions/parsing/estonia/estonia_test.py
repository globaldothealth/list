import os
import unittest

from estonia import estonia

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://esto.nia"
_PARSED_CASE = (
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
            "sourceEntryId": "95013b64dd5ff18548a92eb5375d9c4a1881467390fed4a1c084253ef72be9ea",
        },
        "location": estonia._LOCATION,
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "03/06/2020Z",
                            "end": "03/06/2020Z",
                        },
            },
        ],
        "demographics": {
            "ageRange": {
                "start": 10.0,
                "end": 14.0,
            },
            "gender": "Male",
        },
        "notes": "Case residence: Eesti Tartu maakond",
    })


class EstoniaTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = estonia.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertEqual(next(result), _PARSED_CASE)
