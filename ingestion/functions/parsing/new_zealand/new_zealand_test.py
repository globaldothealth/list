import os
import unittest
from new_zealand import new_zealand
# from pprint import pprint

_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"

_caseReference = {"sourceId": "placeholder_ID", "sourceUrl": "placeholder_URL"}
_NZ = {
    "country": "New Zealand",
    "geoResolution": "Country",
    "name": "New Zealand",
    "geometry": {
        "latitude": -40.900557,
        "longitude": 174.885971,
    },
}

_Bay_of_Plenty = {
    "country": "New Zealand",
    "geoResolution": "Admin1",
    "name": "Bay of Plenty",
    "administrativeAreaLevel1": "Bay of Plenty",
    "geometry": {
        "latitude": -37.9519223,
        "longitude": 176.9945977,
    },
}

_West_Coast = {
    "country": "New Zealand",
    "geoResolution": "Admin1",
    "name": "West Coast",
    "administrativeAreaLevel1": "West Coast",
    "geometry": {
        "latitude": -42.87387,
        "longitude": 171.15336,
    },
}

_notes = (
    "Case imported from abroad. "
    "Case identified at border."
)


def _c(location, gender, age_start, age_end, confirmed_date,
       travel=False, notes=None):
    demographics = {}
    if age_start is not None and age_end is not None:
        demographics["ageRange"] = {"start": age_start, "end": age_end}
    if gender:
        demographics["gender"] = gender
    C = {
        "caseReference": _caseReference,
        "location": location,
        "demographics": demographics,
        "events": [
            {
                "name": "confirmed",
                "dateRange": {"start": confirmed_date, "end": confirmed_date},
            }
        ],
    }
    if not demographics:
        del C["demographics"]
    if travel:
        C["travelHistory"] = {"traveledPrior30Days": True}
    if notes:
        C["notes"] = notes
    return C


"""
Dataset (including sample_data) contains rows with Number_of_cases_reported.
These are tested by duplicating rows below as counts should be imported as
individuals.
"""
_CASES = [
    _c(_NZ, "Male", 40, 49, "11/01/2021Z", True, _notes),
    _c(_NZ, "Female", 40, 49, "11/01/2021Z", True, _notes),
    _c(_NZ, "Male", 20, 29, "11/01/2021Z", True, _notes),
    _c(_NZ, "Female", 10, 19, "11/01/2021Z", True, _notes),
    _c(_NZ, "Male", 30, 39, "10/01/2021Z", True, _notes),
    _c(_NZ, "Male", 0, 9, "10/01/2021Z", True, _notes),
    _c(_NZ, "Male", 30, 39, "10/01/2021Z", True, _notes),
    _c(_NZ, "Male", 20, 29, "10/01/2021Z", True, _notes),
    _c(_Bay_of_Plenty, "Female", 90, 120, "05/05/2021Z", True,
       "Case imported from abroad."),
    _c(_West_Coast, "Female", 20, 29, "06/05/2021Z", False),
    _c(_West_Coast, "Female", 20, 29, "06/05/2021Z", False),
    _c(_West_Coast, "Female", 20, 29, "06/05/2021Z", False),
]


class NewZealandTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 5000

    def test_parse(self):
        """
        Includes a row where province and district are unspecified, where it should return just
        the department and country
        """
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = new_zealand.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _CASES)
