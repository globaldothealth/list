import unittest

import geocode_util
from geocode_util import Geocode


class TestLookupLocation(unittest.TestCase):
    def test_cached_location(self):
        '''
        Test that the lookup function uses the location cache when available.
        '''
        location_cache = {
            ('ny',): (None, 'New York', 'United States'),
        }

        result = geocode_util.lookup_location(
            FakeGeocoder(), location_cache, ['NY'])
        self.assertEqual(result, NYS_GEOCODE)

    def test_single_token_location(self):
        '''
        Test that the lookup function succeeds with a single token.
        '''
        result = geocode_util.lookup_location(
            FakeGeocoder(), {}, ['New York'])
        self.assertEqual(result, NYS_GEOCODE)

    def test_two_token_location(self):
        '''
        Test that the lookup function succeeds with two tokens.
        '''
        result = geocode_util.lookup_location(
            FakeGeocoder(), {}, ['New York', 'United States'])
        self.assertEqual(result, NYS_GEOCODE)

    def test_three_token_location(self):
        '''
        Test that the lookup function succeeds with three tokens.
        '''
        result = geocode_util.lookup_location(
            FakeGeocoder(), {}, ['New York City', 'New York', 'United States'])
        self.assertEqual(result, NYC_GEOCODE)

    def test_throws_for_no_tokens(self):
        '''
        Test that the lookup function throws when no tokens are passed in.
        '''
        with self.assertRaises(ValueError) as cm:
            geocode_util.lookup_location(
                FakeGeocoder(), {}, [])
        self.assertIn('no location tokens', str(cm.exception).lower())

    def test_throws_for_too_many_tokens(self):
        '''
        Test that the lookup function throws when too many tokens are passed in.
        '''
        with self.assertRaises(ValueError) as cm:
            geocode_util.lookup_location(
                FakeGeocoder(), {}, ['too', 'many', 'darn', 'tokens'])
        self.assertIn('too many tokens', str(cm.exception).lower())

    def test_throws_for_no_geocode_found(self):
        '''
        Test that the lookup function throws when a match can't be found.
        '''
        with self.assertRaises(ValueError) as cm:
            geocode_util.lookup_location(
                FakeGeocoder(), {}, ['Not New York'])
        self.assertIn('no geocode', str(cm.exception).lower())

    def test_throws_for_ambiguous_location(self):
        '''
        Test that the lookup function throws when there are multiple possible
        matches.
        '''
        with self.assertRaises(ValueError) as cm:
            geocode_util.lookup_location(
                FakeGeocoder(), {}, ['Ambiguous'])
        self.assertIn('ambiguous', str(cm.exception).lower())


'''
An example location with two tokens, to test a location at a sub-admin
# resolution.
'''
NYS_GEOCODE = Geocode(
    lat=1, lng=2, geo_resolution='admin1', country_new='United States',
    admin_id=1, location='', admin3='', admin2='', admin1='New York')

'''
An example location with three tokens, to test a location with full resolution.
'''
NYC_GEOCODE = Geocode(
    lat=1, lng=2, geo_resolution='admin2', country_new='United States',
    admin_id=2, location='', admin3='', admin2='New York City',
    admin1='New York')

'''
An example location to be included multiple times in the map of geocodes to
test ambiguous matches.
'''
AMBIGUOUS_GEOCODE = Geocode(
    lat=1, lng=2, geo_resolution='admin0', country_new='Ambiguous',
    admin_id=0, location='', admin3='', admin2='',
    admin1='')


class FakeGeocoder:
    '''
    A fake geocoder that only supports geocoding for the state and city of New
    York.
    '''

    def __init__(self):
        self.geocodes = {'nys_geocode_id': NYS_GEOCODE,
                         'nyc_geocode_id': NYC_GEOCODE,
                         'ambiguous_geocode_1_id': AMBIGUOUS_GEOCODE,
                         'ambiguous_geocode_2_id': AMBIGUOUS_GEOCODE}

    # Note that this function is only called for three-token and cache use
    # cases.
    def geocode(self, city: str, province: str, country: str):
        if province.lower() != 'new york' or country.lower() != 'united states':
            return None

        if city.lower() == 'new york city':
            return NYC_GEOCODE
        elif city == '':
            return NYS_GEOCODE
        else:
            return None


if __name__ == '__main__':
    unittest.main()
