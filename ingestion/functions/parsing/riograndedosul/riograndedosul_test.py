import csv
import json
import os
import tempfile
import unittest
from datetime import date

import pytest

from riograndedosul import riograndedosul

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://ti.saude.rs.gov.br/covid19/download"
_PARSED_CASE = ({
    "caseReference": {
        "sourceId": "abc123",
        "sourceUrl": "https://ti.saude.rs.gov.br/covid19/download",
    },
    "location": {"query": "PORTO ALEGRE, Rio Grande do Sul, Brazil"},
    "events": [
        {
            "name": "confirmed",
            "dateRange": {"start": "06/18/2020Z", "end": "06/18/2020Z"},
        },
        {
            "name": "onsetSymptoms",
            "dateRange": {"start": "06/02/2020Z", "end": "06/02/2020Z"},
        },
        {
            "name": "hospitalAdmission",
            "dateRange": {"start": "06/18/2020Z", "end": "06/18/2020Z"},
            "value": "Yes",
        },
        {
            "name": "outcome",
            "dateRange": {"start": "07/08/2020Z", "end": "07/08/2020Z"},
            "value": "Death",
        },
    ],
    "demographics": {
        "gender": "Male",
        "ageRange": {"start": 40.0, "end": 49.0},
        "ethnicity": "White",
    },
    "symptoms": {
        "status": "Symptomatic",
        "values": ["Fever", "Cough", "Sore Throat", "Shortness of Breath", "Other"],
    },
    "preexistingConditions": {"hasPreexistingConditions": True, "values": []},
    "notes": "Patient with immunodeficiency, Unspecified pre-existing condition, Neighbourhood: Centro Historico",
})


class RGDSTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = next(
            riograndedosul.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        )
        self.assertCountEqual([result], [_PARSED_CASE])
