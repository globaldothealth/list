import os
import unittest
from datetime import date
from argentina import argentina

_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"


class ArgentinaTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = None

    def test_parse(self):
        '''
        Includes imported and internally transmitted cases
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")
        result = argentina.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [
            {'caseReference': {'sourceId': 'placeholder_ID',
                               'sourceEntryId': '1000007',
                               'sourceUrl': 'placeholder_URL'},
             'location': {
                "administrativeAreaLevel2": "Patiño",
                "country": "Argentina",
                "administrativeAreaLevel1": "Formosa",
                "geoResolution": "Admin2",
                "name": 'Patiño, Formosa, Argentina',
                "geometry": {
                    "latitude": -24.87505855,
                    "longitude": -59.95853733
                },
            },
                'demographics': {'ageRange': {'start': 26.0, 'end': 26.0}, 'gender': 'Male'},
                'events': [{'name': 'confirmed',
                            'value': 'Laboratory Test',
                            'dateRange': {'start': '06/25/2020', 'end': '06/25/2020'}},
                           {'name': 'outcome', 'value': 'Recovered'}],
                'travelHistory': None,
                'notes': 'Using Date of Diagnosis as the date of confirmation., Patient recovery was confirmed by a negative laboratory test., Province in charge of case reported as Formosa, Argentina., Case last updated on 09/18/2020., Case was dealt with through Public health system., Diagnostic notes: Caso confirmado por laboratorio - No Activo por criterio de laboratorio'},
            {'caseReference': {'sourceId': 'placeholder_ID',
                               'sourceEntryId': '1000010',
                               'sourceUrl': 'placeholder_URL'},
             'location': {
                "administrativeAreaLevel2": "Comuna 7",
                "country": "Argentina",
                "administrativeAreaLevel1": "Ciudad Autónoma de Buenos Aires",
                "geoResolution": "Admin2",
                "name": 'Comuna 7, Ciudad Autónoma de Buenos Aires, Argentina',
                "geometry": {
                    "latitude": -34.63655441,
                    "longitude": -58.45188686
                },
            },
                'demographics': {'ageRange': {'start': 7.0, 'end': 7.0}, 'gender': 'Male'},
                'events': [{'name': 'confirmed',
                            'value': 'Laboratory Test',
                            'dateRange': {'start': '06/01/2020', 'end': '06/01/2020'}},
                           {'name': 'outcome', 'value': 'Recovered'}],
                'travelHistory': None,
                'notes': 'Using Date of Diagnosis as the date of confirmation., Patient recovery was confirmed by a number of days elapsing with no symptoms., Province in charge of case reported as CABA, Argentina., Case last updated on 09/18/2020., Case was dealt with through Public health system., Diagnostic notes: Caso confirmado por laboratorio - No activo (por tiempo de evolución)'},
            {'caseReference': {'sourceId': 'placeholder_ID',
                               'sourceEntryId': '1000012',
                               'sourceUrl': 'placeholder_URL'},
             'location': {
                "country": "Argentina",
                "administrativeAreaLevel1": "Ciudad Autónoma de Buenos Aires",
                "geoResolution": "Admin1",
                "name": 'Ciudad Autónoma de Buenos Aires, Argentina',
                "geometry": {
                    "latitude": -34.61448692,
                    "longitude": -58.44590845
                },
            },
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
                'travelHistory': None,
                'notes': 'Using Date of Diagnosis as the date of confirmation., Patient recovery was confirmed by a negative laboratory test., Province in charge of case reported as CABA, Argentina., Case last updated on 09/18/2020., Case was dealt with through Private health system., Diagnostic notes: Caso confirmado por laboratorio - No Activo por criterio de laboratorio'},
            {'caseReference': {'sourceId': 'placeholder_ID',
                               'sourceEntryId': '1000015',
                               'sourceUrl': 'placeholder_URL'},
             'location': {
                "administrativeAreaLevel2": "Comuna 7",
                "country": "Argentina",
                "administrativeAreaLevel1": "Ciudad Autónoma de Buenos Aires",
                "geoResolution": "Admin2",
                "name": 'Comuna 7, Ciudad Autónoma de Buenos Aires, Argentina',
                "geometry": {
                    "latitude": -34.63655441,
                    "longitude": -58.45188686
                },
            },
                'demographics': {'ageRange': {'start': 29.0, 'end': 29.0},
                                 'gender': 'Female'},
                'events': [{'name': 'confirmed',
                            'value': 'Laboratory Test',
                            'dateRange': {'start': '06/01/2020', 'end': '06/01/2020'}},
                           {'name': 'onsetSymptoms',
                            'dateRange': {'start': '05/18/2020', 'end': '05/18/2020'}},
                           {'name': 'outcome', 'value': 'Recovered'}],
                'symptoms': {'status': 'Symptomatic'},
                'travelHistory': None,
                'notes': 'Using Date of Diagnosis as the date of confirmation., Patient recovery was confirmed by a number of days elapsing with no symptoms., Province in charge of case reported as Buenos Aires, Argentina., Case last updated on 09/18/2020., Case was dealt with through Private health system., Diagnostic notes: Caso confirmado por laboratorio - No activo (por tiempo de evolución)'},
            {'caseReference': {'sourceId': 'placeholder_ID',
                               'sourceEntryId': '1039608',
                               'sourceUrl': 'placeholder_URL'},
             'location': {
                "country": "Argentina",
                "administrativeAreaLevel1": "Buenos Aires",
                "geoResolution": "Admin1",
                "name": 'Buenos Aires, Argentina',
                "geometry": {
                    "latitude": -36.67373207,
                    "longitude": -60.55722017
                },
            },
                'demographics': {'ageRange': {'start': 70.0, 'end': 70.0},
                                 'gender': 'Male'},
                'events': [{'name': 'confirmed',
                            'value': 'Laboratory Test',
                            'dateRange': {'start': '06/10/2020', 'end': '06/10/2020'}},
                           {'name': 'onsetSymptoms',
                            'dateRange': {'start': '06/04/2020', 'end': '06/04/2020'}},
                           {'name': 'outcome', 'value': 'Recovered'}],
                'symptoms': {'status': 'Symptomatic'},
                'travelHistory': {
                    "traveledPrior30Days": True,
                    "travel": [
                        {
                            "location": {
                                "country": "Italy",
                                "geoResolution": "Country",
                                "name": 'Italy',
                                "geometry": {
                                    "latitude": 41.87194,
                                    "longitude": 12.56738
                                }
                            }
                        }
                    ]
            },
                'notes': 'Using Date of Diagnosis as the date of confirmation., Patient recovery was confirmed by a negative laboratory test., Province in charge of case reported as Buenos Aires, Argentina., Case last updated on 03/03/2021., Case was dealt with through Public health system., Diagnostic notes: Caso confirmado por laboratorio - No Activo por criterio de laboratorio'}
        ])
