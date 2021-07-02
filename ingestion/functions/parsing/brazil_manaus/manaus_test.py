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
                        "longitude": -60.25962801,
                        "latitude": -2.625919383
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": '01/26/2021Z',
                            "end": '01/26/2021Z'
                        },
                        "value": "PCR test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": '01/23/2021Z',
                            "end": '01/23/2021Z'
                        }
                    },
                    {
                        "name": "hospitalAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": '01/26/2021Z',
                            "end": '01/26/2021Z'
                        }
                    },
                    {
                        "name": "icuAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": '01/28/2021Z',
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
                    "administrativeAreaLevel2": "Manacapuru",
                    "geoResolution": "Admin2",
                    "name": "Manacapuru, Amazonas, Brazil",
                    "geometry": {
                        "longitude": -60.9587578,
                        "latitude": -3.291538169
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": '03/10/2021Z',
                            "end": '03/10/2021Z'
                        },
                        "value": "Serological test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": '02/27/2021Z',
                            "end": '02/27/2021Z'
                        }
                    },
                    {
                        "name": "hospitalAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": '03/09/2021Z',
                            "end": '03/09/2021Z'
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
                            "start": '03/17/2021Z',
                            "end": '03/17/2021Z'
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
            },
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
                "location": {
                    "country": "Brazil",
                    "administrativeAreaLevel1": "Minas Gerais",
                    "administrativeAreaLevel2": "Montes Claros",
                    "geoResolution": "Admin2",
                    "name": "Montes Claros, Minas Gerais, Brazil",
                    "geometry": {
                        "latitude": -16.62071806,
                        "longitude": -43.92881683
                    }
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": '04/07/2021Z',
                            "end": '04/07/2021Z'
                        },
                        "value": "PCR test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": '04/01/2021Z',
                            "end": '04/01/2021Z'
                        }
                    },
                    {
                        "name": "hospitalAdmission",
                        "value": "Yes",
                        "dateRange": {
                            "start": '04/07/2021Z',
                            "end": '04/07/2021Z'
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
                            "start": '04/13/2021Z',
                            "end": '04/13/2021Z'
                        }
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": [
                        "dyspnea", "cough", "hypoxemia"
                    ]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 74.0,
                        "end": 74.0
                    },
                    "ethnicity": "White"
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        'other comorbidity listed as: HAS'
                    ]
                },
                "travelHistory": None
            },
        ])
