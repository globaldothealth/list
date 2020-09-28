import os
import unittest
from datetime import date
from cuba import cuba


_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"

# result = argentina.parse_cases(sample_data_file,'placeholder_ID','placeholder_URL')
# sample_data_file= '/Users/felson/Documents/DPhil/global_health/github/list/ingestion/functions/parsing/argentina/sample_data.csv'


class CubaTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        '''
        Includes imported and internally transmitted cases
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.json")
        result = cuba.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), [{'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': 'it-1',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'Trinidad, Sancti Spíritus, Cuba'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/11/2020', 'end': '03/11/2020'}},
                                                         {'name': 'firstClinicalConsultation',
                                                          'dateRange': {'start': '03/10/2020', 'end': '03/10/2020'}}],
                                              'demographics': {'ageRange': {'start': 61.0, 'end': 61.0},
                                                               'gender': 'Male',
                                                               'nationalities': ['Italy']},
                                              'travelHistory': {'traveledPrior30Days': True,
                                                                'travel': [{'location': {'query': 'Cuba'}}]},
                                              'notes': "Case arrived in Cuba from Italy on 03/10/2020\nCase was contracted abroad and brought into Cuba.\nFirst patient from this country in Cuba.\nCase diagnostic test was performed at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.\nCase was treated at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.\nNotes provided are as follows: \n Hoy 11 de marzo de 2020 el Laboratorio Nacional de Referencia del IPK, informa que tres de los cuatro turistas aislados desde el día de ayer resultaron positivos al Nuevo Coronavirus SARS CoV-2. Procedentes de la región italiana de Lombardía con sintomatología respiratoria, se encontraban hospedados en un hostal en la ciudad de Trinidad, provincia Sancti Spíritus, y que habían arribado por el aeropuerto internacional “José Martí” de La Habana en días recientes. De forma inmediata fueron ingresados en el Instituto de Medicina Tropical Pedro Kourí"},
                                             {'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': 'it-2',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'Trinidad, Sancti Spíritus, Cuba'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/11/2020', 'end': '03/11/2020'}},
                                                         {'name': 'firstClinicalConsultation',
                                                          'dateRange': {'start': '03/10/2020', 'end': '03/10/2020'}}],
                                              'demographics': {'ageRange': {'start': 57.0, 'end': 57.0},
                                                               'gender': 'Female',
                                                               'nationalities': ['Italy']},
                                              'travelHistory': {'traveledPrior30Days': True,
                                                                'travel': [{'location': {'query': 'Cuba'}}]},
                                              'notes': "Case arrived in Cuba from Italy on 03/10/2020\nCase was contracted abroad and brought into Cuba.\nCase diagnostic test was performed at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.\nCase was treated at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.\nNotes provided are as follows: \n Hoy 11 de marzo de 2020 el Laboratorio Nacional de Referencia del IPK, informa que tres de los cuatro turistas aislados desde el día de ayer resultaron positivos al Nuevo Coronavirus SARS CoV-2. Procedentes de la región italiana de Lombardía con sintomatología respiratoria, se encontraban hospedados en un hostal en la ciudad de Trinidad, provincia Sancti Spíritus, y que habían arribado por el aeropuerto internacional “José Martí” de La Habana en días recientes. De forma inmediata fueron ingresados en el Instituto de Medicina Tropical Pedro Kourí"},
                                             {'caseReference': {'sourceId': 'placeholder_ID',
                                                                'sourceEntryId': 'it-3',
                                                                'sourceUrl': 'placeholder_URL'},
                                              'location': {'query': 'Trinidad, Sancti Spíritus, Cuba'},
                                              'events': [{'name': 'confirmed',
                                                          'dateRange': {'start': '03/11/2020', 'end': '03/11/2020'}},
                                                         {'name': 'firstClinicalConsultation',
                                                          'dateRange': {'start': '03/10/2020', 'end': '03/10/2020'}}],
                                              'demographics': {'ageRange': {'start': 60.0, 'end': 60.0},
                                                               'gender': 'Female',
                                                               'nationalities': ['Italy']},
                                              'travelHistory': {'traveledPrior30Days': True,
                                                                'travel': [{'location': {'query': 'Cuba'}}]},
                                              'notes': "Case arrived in Cuba from Italy on 03/10/2020\nCase was contracted abroad and brought into Cuba.\nCase diagnostic test was performed at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.\nCase was treated at Instituto de Medicina Tropical 'Pedro Kourí', La Habana.\nA further 5 people who this case was in contact with are being monitored for symptoms\nNotes provided are as follows: \n Hoy 11 de marzo de 2020 el Laboratorio Nacional de Referencia del IPK, informa que tres de los cuatro turistas aislados desde el día de ayer resultaron positivos al Nuevo Coronavirus SARS CoV-2. Procedentes de la región italiana de Lombardía con sintomatología respiratoria, se encontraban hospedados en un hostal en la ciudad de Trinidad, provincia Sancti Spíritus, y que habían arribado por el aeropuerto internacional “José Martí” de La Habana en días recientes. De forma inmediata fueron ingresados en el Instituto de Medicina Tropical Pedro Kourí"}])
