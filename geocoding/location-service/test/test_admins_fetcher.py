import unittest
from mock import patch
from pymongo_inmemory import MongoClient

from src.app.admins_fetcher import AdminsFetcher
from src.app.geocoder import Geocoder


class TestAdminsFetcher(unittest.TestCase):

    def setUp(self):
        self.mongo = MongoClient()
        self.db = self.mongo['testdb']
        self.fetcher = AdminsFetcher('token', self.db)

    def tearDown(self):
        self.mongo.close()
    
    @patch('src.app.admins_fetcher.mapbox_tile_query')
    def test_itDoesNotFetchWhenNotNeeded(self, mock_call):
        location = {
            'administrativeAreaLevel1': 'foo',
            'administrativeAreaLevel2': 'bar',
            'administrativeAreaLevel3': 'baz',
            'country': 'Brasilistan',
            'geoResolution': Geocoder.Admin3,
            'geometry': {
                'latitude': 12.34,
                'longitude': 45.67,
            },
            'name': 'the',
            'place': 'to be',
        }
        filled_location = self.fetcher.fill_admins(location)
        mock_call.assert_not_called()
        assert filled_location == location

    @patch('src.app.admins_fetcher.mapbox_tile_query')
    def test_itFetchesMissingAdminsFromTheCacheIfPossible(self, mock_call):
        admins = self.db['admins']
        admins.insert_many([
            {
                'id': 'USAFOO', 'name': 'some admin 1',
            },
            {
                'id': 'USABAR', 'name': 'some admin 2',
            },
            {
                'id': 'USABAZ', 'name': 'some admin 3',
            }
        ])
        mock_call.return_value = {
            'features': [
                {
                    'properties': {
                        'id': 'USAFOO',
                        'tilequery': {
                            'layer': 'boundaries_admin_1',
                        },
                    },
                },
                {
                    'properties': {
                        'id': 'USABAR',
                        'tilequery': {
                            'layer': 'boundaries_admin_2',
                        },
                    },
                },
                {
                    'properties': {
                        'id': 'USABAZ',
                        'tilequery': {
                            'layer': 'boundaries_admin_3',
                        },
                    },
                },
            ]
        }
        geocode = {
            'administrativeAreaLevel1': '',
            'administrativeAreaLevel2': '',
            'country': 'Brasilistan',
            'geoResolution': Geocoder.Country,
            'geometry': {
                'latitude': 12.34,
                'longitude': 45.67,
            },
            'name': 'the',
            'place': 'to be',
        }
        filled_geocode = self.fetcher.fill_admins(geocode.copy())
        self.fetcher.fill_admins(geocode.copy())
        mock_call.assert_called_once()
        assert filled_geocode['administrativeAreaLevel1'] == 'some admin 1'
        assert filled_geocode['administrativeAreaLevel2'] == 'some admin 2'
        assert filled_geocode['administrativeAreaLevel3'] == 'some admin 3'
