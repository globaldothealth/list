import os
import unittest

from hongkong import hongkong

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class HongKongTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = hongkong.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(result, [
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "1",
                    "sourceUrl": _SOURCE_URL,
                },
                "location": {
                    # "One country, two systems". We only store countries here.
                    "country": "China",
                    "administrativeAreaLevel1": "Hong Kong",
                    "geoResolution": "Admin1",
                    "name": "Hong Kong",
                    "geometry": {
                        "longitude": "114.15861",
                        "latitude": "22.27833",
                    },
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "01/23/2020Z",
                            "end": "01/23/2020Z",
                        },
                    }, {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "01/01/2020Z",
                            "end": "01/01/2020Z",
                        },
                    }, {
                        "name": "outcome",
                        "value": "Recovered",
                    },
                ],
                "symptoms": {
                    "status": "Symptomatic",
                },
                "notes": "Imported case",
                "demographics": {
                    "ageRange": {
                        "start": 39,
                        "end": 39,
                    },
                    "gender": "Male",
                },
            }, {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "2",
                    "sourceUrl": _SOURCE_URL,
                },
                "location": {
                    # "One country, two systems". We only store countries here.
                    "country": "China",
                    "administrativeAreaLevel1": "Hong Kong",
                    "geoResolution": "Admin1",
                    "name": "Hong Kong",
                    "geometry": {
                        "longitude": "114.15861",
                        "latitude": "22.27833",
                    },
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "01/24/2020Z",
                            "end": "01/24/2020Z",
                        },
                    }, {
                        "name": "hospitalAdmission",
                        "value": "Yes",
                    },
                ],
                "symptoms": {
                    "status": "Asymptomatic",
                },
                "notes": "Imported case",
                "demographics": {
                    "ageRange": {
                        "start": 40,
                        "end": 40,
                    },
                    "gender": "Female",
                },
            }, {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "3",
                    "sourceUrl": _SOURCE_URL,
                },
                "location": {
                    # "One country, two systems". We only store countries here.
                    "country": "China",
                    "administrativeAreaLevel1": "Hong Kong",
                    "geoResolution": "Admin1",
                    "name": "Hong Kong",
                    "geometry": {
                        "longitude": "114.15861",
                        "latitude": "22.27833",
                    },
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "01/25/2020Z",
                            "end": "01/25/2020Z",
                        },
                    }, {
                        "name": "outcome",
                        "value": "Death",
                    },
                ],
                "symptoms": {
                    "status": "Asymptomatic",
                },
                "notes": "Imported case",
                "demographics": {
                    "ageRange": {
                        "start": 40,
                        "end": 40,
                    },
                    "gender": "Female",
                },
            },
        ])
