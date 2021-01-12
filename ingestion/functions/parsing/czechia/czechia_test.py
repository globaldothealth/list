import os
import unittest

from czechia import czechia

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class CzechiaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = czechia.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceUrl": _SOURCE_URL
                },
                "location": {
                    "query": "Semily, Liberecký kraj, Czech Republic"
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 57.0,
                        "end": 57.0
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "11/01/2020Z",
                            "end": "11/01/2020Z"
                        }
                    }
                ],
                "travelHistory": None
            },
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceUrl": _SOURCE_URL
                },
                "location": {
                    "query": "Praha, Hlavní mešto, Czech Republic"
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 38.0,
                        "end": 38.0
                    }
                },
                "events":[
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "10/10/2020Z",
                            "end": "10/10/2020Z"
                        }
                    }
                ],
                "travelHistory": {
                    "traveledPrior30Days": True,
                    "travel": [
                        {
                            "location": {
                                "query": "Ukraine"
                            }
                        }
                    ]
                }
            },
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceUrl": _SOURCE_URL
                },
                "location": {
                    "query": "Hradec Králové, Královéhradecký kraj, Czech Republic"
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 23.0,
                        "end": 23.0
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "11/23/2020Z",
                            "end": "11/23/2020Z"
                        }
                    }
                ],
                "travelHistory": {
                    "traveledPrior30Days": True,
                    "travel": []
                }
            },
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceUrl": _SOURCE_URL
                },
                "location": {
                    "query": "Moravskoslezský kraj, Czech Republic"
                },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                        "start": 27.0,
                        "end": 27.0
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "06/11/2020Z",
                            "end": "06/11/2020Z"
                        }
                    }
                ],
                "travelHistory": None
            }
        ])
