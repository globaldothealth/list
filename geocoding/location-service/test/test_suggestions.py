import unittest
from src.app import main


class SuggestionsTest(unittest.TestCase):

    def setUp(self):
        main.app.config['TESTING'] = True
        self.client = main.app.test_client()
        self.lyon = {
            'administrativeAreaLevel1': 'Rhône',
            'country': 'France',
            'geometry': {
                'latitude': 45.75889,
                'longitude': 4.84139
            },
            'name': 'Lyon',
        }

    def test_seededGeocodesAreSuggested(self):
        self.client.post('/geocode/seed', json=self.lyon)
        response = self.client.get('/geocode/suggest?q=Lyon&limitToResolution=Country,Admin1')
        assert response.status == '200 OK'
        assert response.json == [self.lyon]
