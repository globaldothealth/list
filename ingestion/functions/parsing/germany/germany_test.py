import os
import unittest

from germany import germany

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"
_PARSED_CASE = [
    {
        "caseReference": {
            "sourceId": "abc123",
            "sourceUrl": "foo.bar"
        },
        "location": {
            "administrativeAreaLevel3": "Flensburg",
            "country": "Germany",
            "administrativeAreaLevel1": "Schleswig-Holstein",
            "geoResolution": "Point",
            "name": "Flensburg, Schleswig-Holstein, Germany",
            "geometry": {
                "latitude": 54.78499143,
                "longitude": 9.438526276
            }
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange": {
                    "start": "08/15/2020Z",
                    "end": "08/15/2020Z"
                }
            },
            {
                "name": "onsetSymptoms",
                "dateRange": {
                    "start": "08/15/2020Z",
                    "end": "08/15/2020Z"
                }
            } 
        ],
        "demographics": {
            "gender": "Female",
            "ageRange": {
                "start": 5.0,
                "end": 14.0
            }
        }
    },
    {
        "caseReference": {
            "sourceId": "abc123",
            "sourceUrl": "foo.bar"
        },
        "location": {
            "query": "Berlin, Germany"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange": {
                    "start": "02/07/2021Z",
                    "end": "02/07/2021Z"
                }
            }           
        ],
        "demographics": {
            "gender": "Female",
            "ageRange": {
                "start": 80.0,
                "end": 120.0
            }
        }
    }
]


class GermanyTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = germany.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _PARSED_CASE)
