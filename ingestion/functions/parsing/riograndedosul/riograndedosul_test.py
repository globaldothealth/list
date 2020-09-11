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
_PARSED_CASE = (
    {
        'caseReference': {
            'sourceId': "abc123",
            'sourceUrl': "https://ti.saude.rs.gov.br/covid19/download"
        },
        'location': 'Água Santa, Rio Grande do Sul, Brazil',
        'events': [
            {
                'name': 'confirmed',
                'dateRange': {'start': '08/03/2020Z', 'end': '08/03/2020Z'}
            },
            {
                'name': 'onsetSymptoms',
                'dateRange': {'start': '07/23/2020Z', 'end': '07/23/2020Z'}
            }
        ],
        'demographics': {'gender': 'Female',
                         'ageRange': {'start': 40.0, 'end': 49.0},
                         'ethnicity': 'White'},
        'symptoms': {'status': 'Symptomatic', 'values': ['Cough', 'Sore Throat']},
        'notes': 'Neighbourhood: Interior'})


class RGDSTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = next(riograndedosul.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL))
        self.assertCountEqual([result], [_PARSED_CASE])
