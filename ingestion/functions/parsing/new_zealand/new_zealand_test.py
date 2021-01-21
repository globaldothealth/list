import os
import unittest
from new_zealand import new_zealand

_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"


class NewZealandTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        '''
        Includes a row where province and district are unspecified, where it should return just
        the department and country
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = new_zealand.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result),
                              [{'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                'location': {'query': 'New Zealand'},
                                'demographics': {'ageRange': {'start': 40.0, 'end': 49.0}, 'gender': 'Male'},
                                'events': [{'name': 'confirmed',
                                            'dateRange': {'start': '01/11/2021Z', 'end': '01/11/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                'demographics': {'ageRange': {'start': 40.0, 'end': 49.0},
                                                 'gender': 'Female'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/11/2021Z', 'end': '01/11/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 20.0, 'end': 29.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/11/2021Z', 'end': '01/11/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 10.0, 'end': 19.0},
                                                   'gender': 'Female'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/11/2021Z', 'end': '01/11/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 30.0, 'end': 39.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/10/2021Z', 'end': '01/10/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 0.0, 'end': 9.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/10/2021Z', 'end': '01/10/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 30.0, 'end': 39.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/10/2021Z', 'end': '01/10/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 20.0, 'end': 29.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/10/2021Z', 'end': '01/10/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 30.0, 'end': 39.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/10/2021Z', 'end': '01/10/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'New Zealand'},
                                  'demographics': {'ageRange': {'start': 40.0, 'end': 49.0}, 'gender': 'Male'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/10/2021Z', 'end': '01/10/2021Z'}}],
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case imported from abroad., Case identified at border and placed into managed quarantine.'}])
