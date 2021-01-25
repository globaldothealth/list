import os
import unittest
from peru import peru

_SOURCE_ID = "place_holder_ID"
_SOURCE_URL = "place_holder_URL"


class PeruTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        '''
        Includes a row where province and district are unspecified, where it should return just
        the department and country
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = peru.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result),
                             [{'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': '7320cabdc1aaca6c59014cae76a134e6',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '06/17/2020Z', 'end': '06/17/2020Z'}}],
  'demographics': {'ageRange': {'start': 40.0, 'end': 40.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': 'e81602051997ace8340bb8c18fe24c65',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '07/29/2020Z', 'end': '07/29/2020Z'}}],
  'demographics': {'ageRange': {'start': 32.0, 'end': 32.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': 'cecdbf10074dbc011ae05b3cbd320a6f',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/09/2020Z', 'end': '08/09/2020Z'}}],
  'demographics': {'ageRange': {'start': 38.0, 'end': 38.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': '71ecb6bccb248b0bb2ac72ed51b5e979',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/07/2020Z', 'end': '08/07/2020Z'}}],
  'demographics': {'ageRange': {'start': 34.0, 'end': 34.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': '566af4276cbe9359abe93f9aa86396c3',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/04/2020Z', 'end': '08/04/2020Z'}}],
  'demographics': {'ageRange': {'start': 33.0, 'end': 33.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': '027561e9d126e7c283d79c02cede562d',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/05/2020Z', 'end': '08/05/2020Z'}}],
  'demographics': {'ageRange': {'start': 33.0, 'end': 33.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': 'f016889b9ba5bd95cf15d60205cbd82e',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/06/2020Z', 'end': '08/06/2020Z'}}],
  'demographics': {'ageRange': {'start': 33.0, 'end': 33.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': '971f8e1295583756d81fe42f3318488c',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/03/2020Z', 'end': '08/03/2020Z'}}],
  'demographics': {'ageRange': {'start': 33.0, 'end': 33.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': 'bc45b71b005a96f32eeb97060616a999',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/04/2020Z', 'end': '08/04/2020Z'}}],
  'demographics': {'ageRange': {'start': 30.0, 'end': 30.0},
   'gender': 'Female'}},
 {'caseReference': {'sourceId': 'place_holder_ID',
   'sourceEntryId': '0e2a1928ddd07d99978758e86b034131',
   'sourceUrl': 'place_holder_URL'},
  'location': {'query': 'LIMA Y CALLAO, LIMA, LIMA, Peru'},
  'events': [{'name': 'confirmed',
    'value': None,
    'dateRange': {'start': '08/04/2020Z', 'end': '08/04/2020Z'}}],
  'demographics': {'ageRange': {'start': 30.0, 'end': 30.0},
   'gender': 'Female'}}])
