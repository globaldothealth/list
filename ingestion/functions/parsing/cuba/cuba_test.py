import os
import unittest
from datetime import date
from cuba import cuba


_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"


class CubaTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 15000

    def test_parse(self):
        '''
        Includes imported and internally transmitted cases
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.json")
        result = cuba.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result),
                              [{'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': 'it-1',
                                                  'sourceUrl': 'placeholder_URL'},
                                'location': {'query': 'Trinidad, Sancti Spíritus, Cuba'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '03/11/2020Z', 'end': '03/11/2020Z'}},
                                             {'name': 'firstClinicalConsultation',
                                              'dateRange': {'start': '03/10/2020Z', 'end': '03/10/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 61.0, 'end': 61.0},
                                                   'gender': 'Male',
                                                   'nationalities': ['Italy']},
                                  'travelHistory': {'traveledPrior30Days': True,
                                                    'travel': [{'location': {'query': 'Italy'}}]},
                                  'notes': "Case arrived in Cuba from Italy on 03/10/2020Z,Case was contracted abroad and brought into Cuba.,First patient from this country in Cuba.,Case diagnostic test was performed at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.,Case was treated at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.,Notes provided are as follows: \n Hoy 11 de marzo de 2020 el Laboratorio Nacional de Referencia del IPK, informa que tres de los cuatro turistas aislados desde el día de ayer resultaron positivos al Nuevo Coronavirus SARS CoV-2. Procedentes de la región italiana de Lombardía con sintomatología respiratoria, se encontraban hospedados en un hostal en la ciudad de Trinidad, provincia Sancti Spíritus, y que habían arribado por el aeropuerto internacional “José Martí” de La Habana en días recientes. De forma inmediata fueron ingresados en el Instituto de Medicina Tropical Pedro Kourí,Using schema version 7"},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': 'it-2',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Trinidad, Sancti Spíritus, Cuba'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '03/11/2020Z', 'end': '03/11/2020Z'}},
                                             {'name': 'firstClinicalConsultation',
                                              'dateRange': {'start': '03/10/2020Z', 'end': '03/10/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 57.0, 'end': 57.0},
                                                   'gender': 'Female',
                                                   'nationalities': ['Italy']},
                                  'travelHistory': {'traveledPrior30Days': True,
                                                    'travel': [{'location': {'query': 'Italy'}}]},
                                  'notes': "Case arrived in Cuba from Italy on 03/10/2020Z,Case was contracted abroad and brought into Cuba.,Case diagnostic test was performed at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.,Case was treated at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.,Notes provided are as follows: \n Hoy 11 de marzo de 2020 el Laboratorio Nacional de Referencia del IPK, informa que tres de los cuatro turistas aislados desde el día de ayer resultaron positivos al Nuevo Coronavirus SARS CoV-2. Procedentes de la región italiana de Lombardía con sintomatología respiratoria, se encontraban hospedados en un hostal en la ciudad de Trinidad, provincia Sancti Spíritus, y que habían arribado por el aeropuerto internacional “José Martí” de La Habana en días recientes. De forma inmediata fueron ingresados en el Instituto de Medicina Tropical Pedro Kourí,Using schema version 7"},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': 'it-3',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Trinidad, Sancti Spíritus, Cuba'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '03/11/2020Z', 'end': '03/11/2020Z'}},
                                             {'name': 'firstClinicalConsultation',
                                              'dateRange': {'start': '03/10/2020Z', 'end': '03/10/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 60.0, 'end': 60.0},
                                                   'gender': 'Female',
                                                   'nationalities': ['Italy']},
                                  'travelHistory': {'traveledPrior30Days': True,
                                                    'travel': [{'location': {'query': 'Italy'}}]},
                                  'notes': "Case arrived in Cuba from Italy on 03/10/2020Z,Case was contracted abroad and brought into Cuba.,Case diagnostic test was performed at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.,Case was treated at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.,A further 5 people who this case was in contact with are being monitored for symptoms,Notes provided are as follows: \n Hoy 11 de marzo de 2020 el Laboratorio Nacional de Referencia del IPK, informa que tres de los cuatro turistas aislados desde el día de ayer resultaron positivos al Nuevo Coronavirus SARS CoV-2. Procedentes de la región italiana de Lombardía con sintomatología respiratoria, se encontraban hospedados en un hostal en la ciudad de Trinidad, provincia Sancti Spíritus, y que habían arribado por el aeropuerto internacional “José Martí” de La Habana en días recientes. De forma inmediata fueron ingresados en el Instituto de Medicina Tropical Pedro Kourí,Using schema version 7"}])
