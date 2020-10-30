import os
import unittest

from brazil_espirito_santo import espirito_santo

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"


class EspiritoSantoTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = espirito_santo.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {
                "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
                "location": {
                    "query": "SERRA, Espirito Santo, Brazil"
                },
                "events": [{
                    "name": "confirmed",
                    "dateRange": {
                        "start": "10/27/2020Z",
                        "end": "10/27/2020Z"
                    },
                    "value": "Serological test"
                }],
                "symptoms": {
                    "status": "Symptomatic",
                    "values": [
                        "headache", "fever", "cough", "diarrhoea"
                    ]
                },
                "demographics": {
                    "gender": "Female",
                    "ageRange": {
                        "start": 5.0,
                        "end": 9.0
                    },
                    "ethnicity": "Asian"
                },
                "preexistingConditions": {
                    "hasPreexistingConditions": True,
                    "values": [
                        "lung disease"
                    ]
                },
                "notes": "Neighbourhood: JARDIM CARAPINA, First four years of elementary school not completed"
            }
        ])
