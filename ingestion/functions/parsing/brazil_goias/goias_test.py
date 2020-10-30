import os
import unittest
from brazil_goias import goias

_SOURCE_ID = "abc123"
_SOURCE_URL = "http://datasets.saude.go.gov.br/coronavirus/casos_confirmados.csv"
_PARSED_CASE = ({
    "caseReference": {
        "sourceId": "abc123",
        "sourceUrl": "http://datasets.saude.go.gov.br/coronavirus/casos_confirmados.csv",
    },
    "location": {"query": "APARECIDA DE GOIANIA, Goiás, Brazil"},
    "events": [
        {
            "name": "confirmed",
            "dateRange": {"start": "07/18/2020Z", "end": "07/18/2020Z"},
        },
        {
            "name": "onsetSymptoms",
            "dateRange": {"start": "07/12/2020Z", "end": "07/12/2020Z"},
        },
        {
            "name": "outcome",
            "value": "Recovered"
        }
    ],
    "demographics": {
        "gender": "Female",
        "ageRange": {"start": 20.0, "end": 29.0},
        "ethnicity": "Mixed"
    },
    "preexistingConditions": {"hasPreexistingConditions": True, "values": ["cardiovascular system disease", "diabetes mellitus"]}
})


class GoiasTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = next(
            goias.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        )
        self.assertCountEqual([result], [_PARSED_CASE])