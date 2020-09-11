import csv
import json
import os
import tempfile
import unittest
from datetime import date
from colombia import colombia


_SOURCE_ID = "place_holder"
_SOURCE_URL = "place_holder"


class ColombiaTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        '''
        Includes imported and internally transmitted cases
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")
        result = colombia.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [{'caseReference': {'sourceId': 'place_holder',
                                                                'sourceEntryId': '1',
                                                                'sourceUrl': 'place_holder'},
                                              'location': {'query': 'Bogotá D.C., Bogotá D.C., Colombia'},
                                              'notes': 'Case caught disease abroad and brought it into Colombia \nDate reported online was 03/06/2020. \nPatient recovery was confirmed by a negative PCR test. \n',
                                              'demographics': {'ageRange': {'start': 19.0, 'end': 19.0},
                                                               'gender': 'Female',
                                                               'ethnicity': 'Other'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/06/2020', 'end': '03/06/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '02/27/2020', 'end': '02/27/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'Recovered',
                                                          'dateRange': {'start': '03/13/2020', 'end': '03/13/2020'}}],
                                              'symptoms': {'status': 'Symptomatic', 'values': 'Mild'},
                                              'travelHistory': {'traveledPrior30Days': 'Unknown',
                                                                'Country': {'name': 'ITALIA'}}},
                                             {'caseReference': {'sourceId': 'place_holder',
                                                                'sourceEntryId': '2',
                                                                'sourceUrl': 'place_holder'},
                                              'location': {'query': 'Guadalajara de Buga, Valle del Cauca, Colombia'},
                                              'notes': 'Case caught disease abroad and brought it into Colombia \nDate reported online was 03/09/2020. \nPatient recovery was confirmed by a negative PCR test. \n',
                                              'demographics': {'ageRange': {'start': 34.0, 'end': 34.0},
                                                               'gender': 'Male',
                                                               'ethnicity': 'Other'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/09/2020', 'end': '03/09/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '03/04/2020', 'end': '03/04/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'Recovered',
                                                          'dateRange': {'start': '03/19/2020', 'end': '03/19/2020'}}],
                                              'symptoms': {'status': 'Symptomatic', 'values': 'Mild'},
                                              'travelHistory': {'traveledPrior30Days': 'Unknown',
                                                                'Country': {'name': 'ESPAÑA'}}},
                                             {'caseReference': {'sourceId': 'place_holder',
                                                                'sourceEntryId': '3',
                                                                'sourceUrl': 'place_holder'},
                                              'location': {'query': 'Medellín, Antioquia, Colombia'},
                                              'notes': 'Case caught disease abroad and brought it into Colombia \nDate reported online was 03/09/2020. \nPatient recovery was confirmed by a negative PCR test. \n',
                                              'demographics': {'ageRange': {'start': 50.0, 'end': 50.0},
                                                               'gender': 'Female',
                                                               'ethnicity': 'Other'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/09/2020', 'end': '03/09/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '02/29/2020', 'end': '02/29/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'Recovered',
                                                          'dateRange': {'start': '03/15/2020', 'end': '03/15/2020'}}],
                                              'symptoms': {'status': 'Symptomatic', 'values': 'Mild'},
                                              'travelHistory': {'traveledPrior30Days': 'Unknown',
                                                                'Country': {'name': 'ESPAÑA'}}},
                                             {'caseReference': {'sourceId': 'place_holder',
                                                                'sourceEntryId': '4',
                                                                'sourceUrl': 'place_holder'},
                                              'location': {'query': 'Medellín, Antioquia, Colombia'},
                                              'notes': 'Case was transmitted within Colombia \nDate reported online was 03/11/2020. \nPatient recovery was confirmed by a negative PCR test. \n',
                                              'demographics': {'ageRange': {'start': 55.0, 'end': 55.0},
                                                               'gender': 'Male',
                                                               'ethnicity': 'Other'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/11/2020', 'end': '03/11/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '03/06/2020', 'end': '03/06/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'Recovered',
                                                          'dateRange': {'start': '03/26/2020', 'end': '03/26/2020'}}],
                                              'symptoms': {'status': 'Symptomatic', 'values': 'Mild'}},
                                             {'caseReference': {'sourceId': 'place_holder',
                                                                'sourceEntryId': '5',
                                                                'sourceUrl': 'place_holder'},
                                              'location': {'query': 'Medellín, Antioquia, Colombia'},
                                              'notes': 'Case was transmitted within Colombia \nDate reported online was 03/11/2020. \nPatient recovery was confirmed by a negative PCR test. \n',
                                              'demographics': {'ageRange': {'start': 25.0, 'end': 25.0},
                                                               'gender': 'Male',
                                                               'ethnicity': 'Other'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/11/2020', 'end': '03/11/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '03/08/2020', 'end': '03/08/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'Recovered',
                                                          'dateRange': {'start': '03/23/2020', 'end': '03/23/2020'}}],
                                              'symptoms': {'status': 'Symptomatic', 'values': 'Mild'}},
                                             {'caseReference': {'sourceId': 'place_holder',
                                                                'sourceEntryId': '6',
                                                                'sourceUrl': 'place_holder'},
                                              'location': {'query': 'Itagüí, Antioquia, Colombia'},
                                              'notes': 'Case was transmitted within Colombia \nDate reported online was 03/11/2020. \nPatient recovery was confirmed by a negative PCR test. \n',
                                              'demographics': {'ageRange': {'start': 27.0, 'end': 27.0},
                                                               'gender': 'Female',
                                                               'ethnicity': 'Other'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/11/2020', 'end': '03/11/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '03/06/2020', 'end': '03/06/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'Recovered',
                                                          'dateRange': {'start': '03/26/2020', 'end': '03/26/2020'}}],
                                              'symptoms': {'status': 'Symptomatic', 'values': 'Mild'}}])
