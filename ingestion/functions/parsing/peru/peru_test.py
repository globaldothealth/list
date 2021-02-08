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
                                'location': {'query': 'FERREÑAFE, FERREÑAFE, LAMBAYEQUE, Peru'},
                                'events': [{'name': 'confirmed',
                                            'value': 'Serological test',
                                            'dateRange': {'start': '03/29/2020Z', 'end': '03/29/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 35.0, 'end': 35.0},
                                                   'gender': 'Female'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': 'cecdbf10074dbc011ae05b3cbd320a6f',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'CHORRILLOS, LIMA, Lima Province, Peru'},
                                'events': [{'name': 'confirmed',
                                            'value': 'Serological test',
                                            'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 36.0, 'end': 36.0},
                                                   'gender': 'Male'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '71ecb6bccb248b0bb2ac72ed51b5e979',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 1.0, 'end': 1.0},
                                                   'gender': 'Female'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '566af4276cbe9359abe93f9aa86396c3',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 65.0, 'end': 65.0},
                                                   'gender': 'Female'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '027561e9d126e7c283d79c02cede562d',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 32.0, 'end': 32.0},
                                                   'gender': 'Female'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': 'f016889b9ba5bd95cf15d60205cbd82e',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 44.0, 'end': 44.0},
                                                   'gender': 'Male'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '971f8e1295583756d81fe42f3318488c',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 29.0, 'end': 29.0},
                                                   'gender': 'Female'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': 'bc45b71b005a96f32eeb97060616a999',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 44.0, 'end': 44.0},
                                                   'gender': 'Female'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '0e2a1928ddd07d99978758e86b034131',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA REGION, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 41.0, 'end': 41.0},
                                                   'gender': 'Male'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '1caabc6f4c64b5910bd8254fa0f949ce',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'EL AGUSTINO, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'Serological test',
                                              'dateRange': {'start': '03/30/2020Z', 'end': '03/30/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 40.0, 'end': 40.0},
                                                   'gender': 'Male'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': '028942f0d49b634ff00563c766ea5129',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'PCR test',
                                              'dateRange': {'start': '01/05/2021Z', 'end': '01/05/2021Z'}}],
                                  'demographics': {'gender': 'Male'}},
                               {'caseReference': {'sourceId': 'place_holder_ID',
                                                  'sourceEntryId': 'ca700e98a91c6f267e0cb69d9a32ef91',
                                                  'sourceUrl': 'place_holder_URL'},
                                  'location': {'query': 'LIMA, LIMA, Lima Province, Peru'},
                                  'events': [{'name': 'confirmed',
                                              'value': 'PCR test',
                                              'dateRange': {'start': '01/19/2021Z', 'end': '01/19/2021Z'}}],
                                  'demographics': {'gender': 'Male'}}])
