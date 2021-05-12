import unittest

from src.app import main


class FakeGeocoderTests(unittest.TestCase):

    def setUp(self):
        main.app.config['TESTING'] = True
        self.client = main.app.test_client()

    def test_itCanSeedGeocodes(self):
        response = self.client.post('/geocode/seed', json={
            'administrativeAreaLevel1': 'Rhône',
            'country': 'France',
            'geometry': {
                'latitude': 45.75889,
                'longitude': 4.84139
            },
            'name': 'Lyon',
        })
        assert response.status == '200 OK'

    def test_itCanClearGeocodes(self):
        response = self.client.post('/geocode/clear')
        assert response.status == '200 OK'