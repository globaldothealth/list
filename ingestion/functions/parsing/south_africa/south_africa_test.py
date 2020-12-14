import os
import unittest

from south_africa import south_africa

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class SouthAfricaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = south_africa.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "13",
                    "sourceUrl": _SOURCE_URL,
                    "additionalSources": [{
                        "sourceUrl": "github.com/dsfsi/covid19za"
                    }]
                },
                "location": {
                    "query": "Western Cape, South Africa"
                },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                        "start": 36.0,
                        "end": 36.0
                    }
                },
                "events": [{
                    "name": "confirmed",
                    "dateRange": {
                        "start": "03/11/2020Z",
                        "end": "03/11/2020Z"
                    }
                }],
                "travelHistory": {
                    "traveledPrior30Days": True,
                    "travel": [
                        {"location": {
                            "query": "Austria"
                        }},
                        {"location": {
                            "query": "Switzerland"
                        }},
                        {"location": {
                            "query": "Germany"
                        }},
                        {"location": {
                            "query": "Dubai, United Arab Emirates"
                        }}
                    ],
                }
            },
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "25",
                    "sourceUrl": _SOURCE_URL,
                    "additionalSources": [{
                        "sourceUrl": "github.com/dsfsi/covid19za"
                    }]
                },
                "location": {
                    "query": "Gauteng, South Africa"
                },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                        "start": 76.0,
                        "end": 76.0
                    }
                },
                "events": [{
                    "name": "confirmed",
                    "dateRange": {
                        "start": "03/14/2020Z",
                        "end": "03/14/2020Z"
                    }
                }],
                "travelHistory": {
                    "traveledPrior30Days": True,
                    "travel": [
                        {"location": {
                            "query": "United Kingdom"
                        }},
                        {"location": {
                            "query": "United States"
                        }}
                    ],
                }
            },
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "117",
                    "sourceUrl": _SOURCE_URL,
                    "additionalSources": [{
                        "sourceUrl": "github.com/dsfsi/covid19za"
                    }]
                },
                "location": {
                    "query": "Gauteng, South Africa"
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 41.0,
                        "end": 41.0
                    }
                },
                "events": [{
                    "name": "confirmed",
                    "dateRange": {
                        "start": "03/19/2020Z",
                        "end": "03/19/2020Z"
                    }
                }],
                "travelHistory": {
                    "traveledPrior30Days": True,
                    "travel": [
                        {"location": {
                            "query": "Congo, The Democratic Republic of the"
                        }}
                    ],
                }
            },
            {
                "caseReference": {
                    "sourceId": _SOURCE_ID,
                    "sourceEntryId": "366",
                    "sourceUrl": _SOURCE_URL,
                    "additionalSources": None
                },
                "location": {
                    "query": "South Africa"
                },
                "demographics": {
                    "gender": None
                },
                "events": [{
                    "name": "confirmed",
                    "dateRange": {
                        "start": "03/23/2020Z",
                        "end": "03/23/2020Z"
                    }
                }],
                "travelHistory": None
            } 
        ])
