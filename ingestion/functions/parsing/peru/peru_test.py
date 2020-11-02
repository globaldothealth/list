<<<<<<< HEAD
import csv
import json
import os
import tempfile
import unittest
from datetime import date
=======
import os
import unittest
>>>>>>> main
from peru import peru

_SOURCE_ID = "place_holder"
_SOURCE_URL = "place_holder"


class PeruTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        '''
<<<<<<< HEAD
        Includes a row where province and district are unspecified, where it should return just 
=======
        Includes a row where province and district are unspecified, where it should return just
>>>>>>> main
        the department and country
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = peru.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
<<<<<<< HEAD
        self.assertCountEqual(list(result), [{'caseReference': {'sourceId': 'place_holder',
                                                          'sourceEntryId': '7320cabdc1aaca6c59014cae76a134e6',
                                                          'sourceUrl': 'place_holder'},
                                        'location': {'query': 'AYACUCHO, HUAMANGA, AYACUCHO, Peru'},
                                        'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'},
                                        'events': [{'name': 'confirmed',
                                                    'value': 'PCR test',
                                                    'dateRange': {'start': '07/24/2020', 'end': '07/24/2020'}}]},
                                       {'caseReference': {'sourceId': 'place_holder',
                                                          'sourceEntryId': 'e81602051997ace8340bb8c18fe24c65',
                                                          'sourceUrl': 'place_holder'},
                                        'location': {'query': 'CHIMBOTE, SANTA, ANCASH, Peru'},
                                        'demographics': {'ageRange': {'start': 53.0, 'end': 53.0},
                                                         'gender': 'Female'},
                                        'events': [{'name': 'confirmed',
                                                    'value': 'PCR test',
                                                    'dateRange': {'start': '07/24/2020', 'end': '07/24/2020'}}]},
                                       {'caseReference': {'sourceId': 'place_holder',
                                                          'sourceEntryId': 'cecdbf10074dbc011ae05b3cbd320a6f',
                                                          'sourceUrl': 'place_holder'},
                                        'location': {'query': 'ANCON, LIMA, LIMA, Peru'},
                                        'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'},
                                        'events': [{'name': 'confirmed',
                                                    'value': 'PCR test',
                                                    'dateRange': {'start': '07/23/2020', 'end': '07/23/2020'}}]},
                                       {'caseReference': {'sourceId': 'place_holder',
                                                          'sourceEntryId': '566af4276cbe9359abe93f9aa86396c3',
                                                          'sourceUrl': 'place_holder'},
                                        'location': {'query': 'CUSCO, CUSCO, CUSCO, Peru'},
                                        'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'},
                                        'events': [{'name': 'confirmed',
                                                    'value': 'PCR test',
                                                    'dateRange': {'start': '07/23/2020', 'end': '07/23/2020'}}]},
                                       {'caseReference': {'sourceId': 'place_holder',
                                                          'sourceEntryId': '027561e9d126e7c283d79c02cede562d',
                                                          'sourceUrl': 'place_holder'},
                                        'location': {'query': 'LIMA, Peru'},
                                        'demographics': {'ageRange': {'start': 28.0, 'end': 28.0}, 'gender': 'Male'},
                                        'events': [{'name': 'confirmed',
                                                    'value': 'PCR test',
                                                    'dateRange': {'start': '07/24/2020', 'end': '07/24/2020'}
                                                    }]}
                                       ]
                              )
=======
        self.assertCountEqual(
            list(result), [
                {'caseReference': {'sourceId': 'place_holder',
                                   'sourceEntryId': '7320cabdc1aaca6c59014cae76a134e6',
                                   'sourceUrl': 'place_holder'},
                 'location': {'query': 'AYACUCHO, HUAMANGA, AYACUCHO, Peru'},
                 'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'},
                 'events': [{'name': 'confirmed',
                             'value': 'PCR test',
                             'dateRange': {'start': '07/24/2020Z', 'end': '07/24/2020Z'}}]},
                {'caseReference': {'sourceId': 'place_holder',
                                   'sourceEntryId': 'e81602051997ace8340bb8c18fe24c65',
                                   'sourceUrl': 'place_holder'},
                 'location': {'query': 'ANCASH, SANTA, CHIMBOTE, Peru'},
                 'demographics': {'ageRange': {'start': 53.0, 'end': 53.0},
                                  'gender': 'Female'},
                 'events': [{'name': 'confirmed',
                             'value': 'PCR test',
                             'dateRange': {'start': '07/24/2020Z', 'end': '07/24/2020Z'}}]},
                {'caseReference': {'sourceId': 'place_holder',
                                   'sourceEntryId': 'cecdbf10074dbc011ae05b3cbd320a6f',
                                   'sourceUrl': 'place_holder'},
                 'location': {'query': 'LIMA, LIMA, ANCON, Peru'},
                 'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'},
                 'events': [{'name': 'confirmed',
                             'value': 'PCR test',
                             'dateRange': {'start': '07/23/2020Z', 'end': '07/23/2020Z'}}]},
                {'caseReference': {'sourceId': 'place_holder',
                                   'sourceEntryId': '566af4276cbe9359abe93f9aa86396c3',
                                   'sourceUrl': 'place_holder'},
                 'location': {'query': 'CUSCO, CUSCO, CUSCO, Peru'},
                 'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'},
                 'events': [{'name': 'confirmed',
                             'value': 'PCR test',
                             'dateRange': {'start': '07/23/2020Z', 'end': '07/23/2020Z'}}]},
                {'caseReference': {'sourceId': 'place_holder',
                                   'sourceEntryId': '027561e9d126e7c283d79c02cede562d',
                                   'sourceUrl': 'place_holder'},
                 'location': {'query': 'LIMA, Peru'},
                 'demographics': {'ageRange': {'start': 28.0, 'end': 28.0}, 'gender': 'Male'},
                 'events': [{'name': 'confirmed',
                             'value': 'PCR test',
                             'dateRange': {'start': '07/24/2020Z', 'end': '07/24/2020Z'}
                             }]},
                {'caseReference': {'sourceId': 'place_holder',
                                   'sourceEntryId': '027561e9d126e7c283d79c02cede562f',
                                   'sourceUrl': 'place_holder'},
                 'location': {'query': 'LIMA, Peru'},
                 'demographics': None,
                 'events': [{'name': 'confirmed',
                             'value': 'PCR test',
                             'dateRange': {'start': '07/24/2020Z', 'end': '07/24/2020Z'}
                             }]}
            ]
        )
>>>>>>> main
