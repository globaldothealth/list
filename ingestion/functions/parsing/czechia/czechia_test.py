import os
import unittest

from czechia import czechia

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"

_UA = {
    "location": {
        "name": "Ukraine",
        "country": "UA",
        "geoResolution": "Country",
        "geometry": {"latitude": 48.379433, "longitude": 31.16558},
    }
}
_Semily = {
    "administrativeAreaLevel1": "Liberecký kraj",
    "administrativeAreaLevel2": "Semily",
    "country": "Czech Republic",
    "geoResolution": "Admin2",
    "geometry": {"latitude": 50.602249, "longitude": 15.33526},
    "name": "Semily",
}
_Praha = {
    "administrativeAreaLevel1": "Praha, Hlavní mešto",
    "country": "Czech Republic",
    "geoResolution": "Admin1",
    "geometry": {"latitude": 50.0596288, "longitude": 14.446459273258009},
    "name": "Praha",
}
_Moravskoslezský_kraj = {
    "administrativeAreaLevel1": "Moravskoslezský kraj",
    "country": "Czech Republic",
    "geoResolution": "Admin1",
    "geometry": {"latitude": 49.860275, "longitude": 18.038654134727693},
    "name": "Moravskoslezský kraj",
}
_Hradec_Králové = {
    "administrativeAreaLevel1": "Královéhradecký kraj",
    "administrativeAreaLevel2": "Hradec Králové",
    "country": "Czech Republic",
    "geoResolution": "Admin2",
    "geometry": {"latitude": 50.2092113, "longitude": 15.8327512},
    "name": "Hradec Králové",
}


def _c(location, age, gender, confirmed_date, travel_history=None):
    return {
        "caseReference": {"sourceId": _SOURCE_ID, "sourceUrl": _SOURCE_URL},
        "location": location,
        "demographics": {
            "gender": gender,
            "ageRange": {
                "start": age,
                "end": age,
            },
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": confirmed_date, "end": confirmed_date},
            }
        ],
        "travelHistory": travel_history,
    }


_CASES = [
    _c(_Semily, 57, "Female", "11/01/2020Z"),
    _c(
        _Praha,
        38,
        "Female",
        "10/10/2020Z",
        {"traveledPrior30Days": True, "travel": [_UA]},
    ),
    _c(
        _Hradec_Králové,
        23,
        "Female",
        "11/23/2020Z",
        {"traveledPrior30Days": True},
    ),
    _c(_Moravskoslezský_kraj, 27, "Male", "06/11/2020Z"),
]


class CzechiaTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = czechia.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _CASES)
