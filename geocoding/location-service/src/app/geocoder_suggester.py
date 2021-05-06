from src.app.geocoder import Geocoder

class GeocodeSuggester:
    """Suggest geocoding by asking a cohort of geocoders to locate the query."""

    def __init__(self, geocoders):
        self.geocoders = geocoders
    
    def limitToValidResolution(self, queryLimit):
        values = set([Geocoder.Country, Geocoder.Admin1, Geocoder.Admin2, Geocoder.Admin3, Geocoder.Point])
        if queryLimit not in values:
            raise ValueError
        return queryLimit


    def suggest(self, request):
        """Interpret the request and pass it to the geocoders until one of them
        returns a geocode result."""
        if 'q' not in request:
            return []
        opts = { }
        if 'limitToResolution' in request:
            limit = []
            opts['limitToResolution'] = [self.limitToValidResolution(x) for x in request['limitToResolution'].split(',')]
        for g in self.geocoders:
            suggestions = g.geocode(request['q'], opts)
            if len(suggestions) > 0:
                return suggestions
        return []
