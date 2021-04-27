import json
import unittest
from mock import patch

from src.app.geocoder import Geocoder

class GeocodeTests(unittest.TestCase):

    def setUp(self):
        with open('test/lyon.json', 'r') as file:
            data = file.read()
            self.lyon = json.loads(data)

    @patch('src.app.geocoder.mapbox_geocode')
    def test_success(self, mapbox_patch):
        mapbox_patch.return_value = {
            'features': [
                self.lyon
            ],
        }
        geocoder = Geocoder('api_token')
        feats = geocoder.geocode('some query', {
            'limitToResolution': [ Geocoder.Admin3, Geocoder.Admin2 ]
        })
        assert len(feats) == 1
        wantFeature = {
            'country': 'France',
            'geometry': {
                'latitude': 45.75889,
                'longitude': 4.84139
            },
            'place': '',
            'name': 'Lyon, Rhône, France',
            'geoResolution': Geocoder.Admin3
        }
        print("feats[0]")
        print(feats)
        assert feats[0] == wantFeature