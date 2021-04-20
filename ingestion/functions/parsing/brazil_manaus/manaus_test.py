import os
import unittest

from brazil_manaus import manaus

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class ManausTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = manaus.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
                "location": {
                    "country": "Brazil",
                    "administrativeAreaLevel1": "Amazonas",
                    "administrativeAreaLevel2": "Manaus",
                    "geoResolution": "Admin2",
                    "name": "Manaus, Amazonas, Brazil",
                    "geometry": {
                        "longitude": -60.025780,
                        "latitude": -3.117034
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": {'$date': '2021-01-26T00:00:00Z'},
                            "end": {'$date': '2021-01-26T00:00:00Z'}
                        },
                        "value": "PCR test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": {'$date': '2021-01-23T00:00:00Z'},
                            "end": {'$date': '2021-01-23T00:00:00Z'}
                        }
                    },
                    {
                        "name": "hospitalAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": {'$date': '2021-01-26T00:00:00Z'},
                            "end": {'$date': '2021-01-26T00:00:00Z'}
                        }
                    },
                    {
                        "name": "icuAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": {'$date': '2021-01-28T00:00:00Z'},
                            "end": None
                        }
                    },
                    {
                        "name": "outcome",
                        "value": "Recovered",
                        "dateRange": {
                            "start": None,
                            "end": None
                        }
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": [
                        "dyspnea", "fever", "cough", "hypoxemia"
                    ]
                },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                        "start": 18.0,
                        "end": 18.0
                    },
                    "ethnicity": "Mixed"
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        "nervous system disease"
                    ]
                },
                "travelHistory": None
            },
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
                "location": {
                    "country": "Brazil",
                    "administrativeAreaLevel1": "Amazonas",
                    "administrativeAreaLevel2": "Manaus",
                    "geoResolution": "Admin2",
                    "name": "Manaus, Amazonas, Brazil",
                    "geometry": {
                        "longitude": -60.025780,
                        "latitude": -3.117034
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": {'$date': '2021-03-10T00:00:00Z'},
                            "end": {'$date': '2021-03-10T00:00:00Z'}
                        },
                        "value": "Serological test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": {'$date': '2021-02-27T00:00:00Z'},
                            "end": {'$date': '2021-02-27T00:00:00Z'}
                        }
                    },
                    {
                        "name": "hospitalAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": {'$date': '2021-03-09T00:00:00Z'},
                            "end": {'$date': '2021-03-09T00:00:00Z'}
                        }
                    },
                    {
                        "name": "icuAdmission",
                        "value": "No",
                    },
                    {
                        "name": "outcome",
                        "value": "Death",
                        "dateRange": {
                            "start": {'$date': '2021-03-17T00:00:00Z'},
                            "end": {'$date': '2021-03-17T00:00:00Z'}
                        }
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": [
                        "dyspnea", "fever", "cough"
                    ]
                },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                        "start": 46.0,
                        "end": 46.0
                    },
                    "ethnicity": "White"
                },
                "preexistingConditions": None,
                "travelHistory": {
                    "traveledPrior30Days": True,
                    "travel": [
                        {
                            "location": {
                                "country": "Antarctica",
                                "geoResolution": "Country",
                                "name": "Antarctica",
                                "geometry": {
                                    "latitude": -75.250973,
                                    "longitude": -0.071389
                                }
                            },
                        }
                    ],
                    "dateRange": {
                        "start": None,
                        "end": None
                    }
                },
                "notes": "Patient died from other causes"
            }
        ])