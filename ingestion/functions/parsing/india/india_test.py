import os
import unittest

from india import india

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASES = [
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "297634-1",
            "sourceUrl": _SOURCE_URL,
            "additionalSources": [
                {
                    "sourceUrl": "https://twitter.com/HFWOdisha/status/1308286422281977856"
                }
            ]
        },
        "location": {
            "limitToResolution": "Admin2,Admin1,Country",
            "query": "Balasore, Odisha, India"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "09/22/2020Z",
                            "end": "09/22/2020Z"
                        }
            },
            {
                "name": "outcome",
                "value": "Death"
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 65.0,
                "end": 65.0
            },
            "gender": "Male",
            "nationalities": [
                "Bengladeshi"
            ]
        },
        "notes": "was also suffering from Diabetes, hypertension."
    },
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "297649-1",
            "sourceUrl": _SOURCE_URL,
            "additionalSources": [
                {
                    "sourceUrl": "https://twitter.com/PIB_Patna/status/1308375952653611008"
                }
            ]
        },
        "location": {
            "limitToResolution": "Admin2,Admin1,Country",
            "query": "Arwal, Bihar, India"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "09/22/2020Z",
                            "end": "09/22/2020Z"
                        }
            },
            {
                "name": "hospitalAdmission",
                "value": "Yes"
            }
        ],
        "demographics": None,
        "notes": None
    },
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "297649-2",
            "sourceUrl": _SOURCE_URL,
            "additionalSources": [
                {
                    "sourceUrl": "https://twitter.com/PIB_Patna/status/1308375952653611008"
                }
            ]
        },
        "location": {
            "limitToResolution": "Admin2,Admin1,Country",
            "query": "Arwal, Bihar, India"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "09/22/2020Z",
                            "end": "09/22/2020Z"
                        }
            },
            {
                "name": "hospitalAdmission",
                "value": "Yes"
            }
        ],
        "demographics": None,
        "notes": None
    },
]


class IndiaTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = india.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASES)
