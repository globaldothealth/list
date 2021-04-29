from src.integration.mapbox_client import mapbox_tile_query


class AdminsFetcher:

    def __init__(self,access_token):
        self.access_token = access_token
    
    def fill_admins(self, geocode):
        if 'administrativeAreaLevel1' in geocode and 'administrativeAreaLevel2' in geocode and 'administrativeAreaLevel3' in geocode:
            return geocode
        pass