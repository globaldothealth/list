import unittest
from mock import patch

from src.app.admins_fetcher import AdminsFetcher
from src.app.geocoder import Geocoder


class TestAdminsFetcher(unittest.TestCase):

    def setUp(self):
        self.fetcher = AdminsFetcher('token')
    
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
