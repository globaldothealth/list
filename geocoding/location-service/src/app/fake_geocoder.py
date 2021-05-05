class FakeGeocoder:
    """A fake geocoder lets us do integration tests by seeding responses to geocode requests."""
    def __init__(self):
        self.values = {}

    def seed(self, key, response):
        self.values[key] = response

    def clear(self):
        self.values = {}

    def geocode(self, query, opts):
        if query in self.values:
            return [self.values[query]]
        else:
            return []
