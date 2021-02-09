import os
import unittest

from brazil_santa_catarina import santa_catarina

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class SantaCatarinaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = santa_catarina.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "BLUMENAU, Santa Catarina, Brazil"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "01/17/2021Z",
                            "end": "01/17/2021Z"
                        },
                        "value": "Serological test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "12/06/2020Z",
                            "end": "12/06/2020Z"
                        }
                    },
                    {
                        "name": "outcome",
                        "value": "Recovered"
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": ["cough", "throat pain", "fever"]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 44.0,
                        "end": 44.0
                    },
                    "ethnicity": None
                },
                "preexistingConditions": None,
                "notes": "Neighbourhood: ESCOLA AGRICOLA"
            },
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "FLORIANOPOLIS, Santa Catarina, Brazil"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange": {
                            "start": "12/07/2020Z",
                            "end": "12/07/2020Z"
                        },
                        "value": "PCR test"
                    },
                    {
                        "name": "onsetSymptoms",
                        "dateRange": {
                            "start": "12/04/2020Z",
                            "end": "12/04/2020Z"
                        }
                    },
                    {
                        "name": "outcome",
                        "dateRange": {
                            "start": "12/10/2020Z",
                            "end": "12/10/2020Z"
                        },
                        "value": "Death"
                    },
                    {
                        "name": "hospitalAdmission",
                        "dateRange": {
                            "start": "12/07/2020Z",
                            "end": "12/07/2020Z"
                        },
                        "value": "Yes"
                    },
                    {
                        "name": "icuAdmission",
                        "dateRange": {
                            "start": "12/08/2020Z",
                            "end": "12/08/2020Z"
                        },
                        "value": "Yes"
                    }
                ],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": ["dyspnea", "fever", "diarrhoea"]
                },
                "demographics": {
                    "gender": "Male",
                    "ageRange": {
                        "start": 83.0,
                        "end": 83.0
                    },
                    "ethnicity": "White"
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": ["cardiovascular system disease"]
                },
                "notes": "Neighbourhood: JARDIM ATLANTICO"
            }          
        ])
