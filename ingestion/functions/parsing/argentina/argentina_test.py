import os
import unittest
from datetime import date
from argentina import argentina


_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"

# result = argentina.parse_cases(sample_data_file,'placeholder_ID','placeholder_URL')
# sample_data_file= '/Users/felson/Documents/DPhil/global_health/github/list/ingestion/functions/parsing/argentina/sample_data.csv'

class ArgentinaTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        '''
        Includes imported and internally transmitted cases
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")
        result = argentina.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [{'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': '1000007',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'Formosa, Argentina'},
                                              'demographics': {'ageRange': {'start': 26.0, 'end': 26.0}, 'gender': 'Male'},
                                              'events': [{'name': 'confirmed',
                                                          'value': 'Laboratory Test',
                                                          'dateRange': {'start': '06/25/2020', 'end': '06/25/2020'}},
                                                         {'name': 'outcome', 'value': 'Recovered'}],
                                              'notes': 'Using Date of Diagnosis as the date of confirmation.\nPatient recovery was confirmed by a negative laboratory test.\nCase was registered as being from Formosa, Patiño, Argentina.\nCase last updated on 09/18/2020.\nCase was dealt with through Public health system.\nDiagnostic notes: Caso confirmado por laboratorio - No Activo por criterio de laboratorio'},
                                             {'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': '1000010',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'CABA, Argentina'},
                                              'demographics': {'ageRange': {'start': 7.0, 'end': 7.0}, 'gender': 'Male'},
                                              'events': [{'name': 'confirmed',
                                                          'value': 'Laboratory Test',
                                                          'dateRange': {'start': '06/01/2020', 'end': '06/01/2020'}},
                                                         {'name': 'outcome', 'value': 'Recovered'}],
                                              'notes': 'Using Date of Diagnosis as the date of confirmation.\nPatient recovery was confirmed by a number of days elapsing with no symptoms.\nCase was registered as being from CABA, COMUNA 07, Argentina.\nCase last updated on 09/18/2020.\nCase was dealt with through Public health system.\nDiagnostic notes: Caso confirmado por laboratorio - No activo (por tiempo de evolución)'},
                                             {'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': '1000012',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'CABA, Argentina'},
                                              'demographics': {'ageRange': {'start': 46.0, 'end': 46.0}, 'gender': 'Male'},
                                              'events': [{'name': 'confirmed',
                                                          'value': 'Laboratory Test',
                                                          'dateRange': {'start': '05/31/2020', 'end': '05/31/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '05/26/2020', 'end': '05/26/2020'}},
                                                         {'name': 'outcome',
                                                          'value': 'hospitalAdmission',
                                                          'dateRange': {'start': '05/31/2020', 'end': '05/31/2020'}},
                                                         {'name': 'outcome', 'value': 'Recovered'}],
                                              'symptoms': {'status': 'Symptomatic'},
                                              'notes': 'Using Date of Diagnosis as the date of confirmation.\nPatient recovery was confirmed by a negative laboratory test.\nCase was registered as being from CABA, SIN ESPECIFICAR, Argentina.\nCase last updated on 09/18/2020.\nCase was dealt with through Private health system.\nDiagnostic notes: Caso confirmado por laboratorio - No Activo por criterio de laboratorio'},
                                             {'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': '1000015',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'Buenos Aires, Argentina'},
                                              'demographics': {'ageRange': {'start': 29.0, 'end': 29.0},
                                                               'gender': 'Female'},
                                              'events': [{'name': 'confirmed',
                                                          'value': 'Laboratory Test',
                                                          'dateRange': {'start': '06/01/2020', 'end': '06/01/2020'}},
                                                         {'name': 'onsetSymptoms',
                                                          'dateRange': {'start': '05/18/2020', 'end': '05/18/2020'}},
                                                         {'name': 'outcome', 'value': 'Recovered'}],
                                              'symptoms': {'status': 'Symptomatic'},
                                              'notes': 'Using Date of Diagnosis as the date of confirmation.\nPatient recovery was confirmed by a number of days elapsing with no symptoms.\nCase was registered as being from CABA, COMUNA 07, Argentina.\nCase last updated on 09/18/2020.\nCase was dealt with through Private health system.\nDiagnostic notes: Caso confirmado por laboratorio - No activo (por tiempo de evolución)'}])
