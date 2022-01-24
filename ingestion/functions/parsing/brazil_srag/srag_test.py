import os
import unittest

from brazil_srag import srag

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"

_EXPECTED = [
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "foo.bar"},
        "demographics": {
            "ageRange": {"end": 79.0, "start": 79.0},
            "ethnicity": "White",
            "gender": "Male",
        },
        "events": [
            {
                "dateRange": {"end": "01/11/2021Z", "start": "01/11/2021Z"},
                "name": "confirmed",
                "value": "PCR test",
            },
            {
                "dateRange": {"end": "01/03/2021Z", "start": "01/03/2021Z"},
                "name": "onsetSymptoms",
            },
            {
                "dateRange": {"end": "01/11/2021Z", "start": "01/11/2021Z"},
                "name": "hospitalAdmission",
                "value": "Yes",
            },
            {"name": "icuAdmission", "value": "No"},
            {
                "dateRange": {"end": "01/23/2021Z", "start": "01/23/2021Z"},
                "name": "outcome",
                "value": "Recovered",
            },
        ],
        "location": {
            "administrativeAreaLevel1": "São Paulo",
            "administrativeAreaLevel2": "São Paulo",
            "country": "Brazil",
            "geoResolution": "Admin2",
            "geometry": {"latitude": -23.65008109, "longitude": -46.64811076},
            "name": "São Paulo, São Paulo, Brazil",
        },
        "preexistingConditions": {
            "hasPreexistingConditions": True,
            "values": ["heart disease"],
        },
        "symptoms": {"status": "Symptomatic", "values": ["dyspnea", "hypoxemia"]},
        "travelHistory": None,
        "vaccines": [
            {"batch": "231123w2", "date": "08/13/2021Z"},
            {"batch": "231123w3", "date": "11/13/2021Z"},
        ],
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "foo.bar"},
        "demographics": {
            "ageRange": {"end": 47.0, "start": 47.0},
            "ethnicity": "Black",
            "gender": "Female",
        },
        "events": [
            {
                "dateRange": {"end": "01/10/2021Z", "start": "01/10/2021Z"},
                "name": "confirmed",
                "value": None,
            },
            {
                "dateRange": {"end": "01/10/2021Z", "start": "01/10/2021Z"},
                "name": "onsetSymptoms",
            },
            {
                "dateRange": {"end": "01/10/2021Z", "start": "01/10/2021Z"},
                "name": "hospitalAdmission",
                "value": "Yes",
            },
        ],
        "location": {
            "administrativeAreaLevel1": "São Paulo",
            "administrativeAreaLevel2": "Campinas",
            "country": "Brazil",
            "geoResolution": "Admin2",
            "geometry": {"latitude": -22.88376008, "longitude": -47.04379961},
            "name": "Campinas, São Paulo, Brazil",
        },
        "preexistingConditions": {
            "hasPreexistingConditions": True,
            "values": ["respiratory system disease"],
        },
        "symptoms": {
            "status": "Symptomatic",
            "values": ["dyspnea", "fever", "cough", "hypoxemia"],
        },
        "travelHistory": None,
        "vaccines": [{"batch": "245231", "date": "08/14/2021Z"}],
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "foo.bar"},
        "demographics": {
            "ageRange": {"end": 90.0, "start": 90.0},
            "ethnicity": "White",
            "gender": "Female",
        },
        "events": [
            {
                "dateRange": {"end": "01/11/2021Z", "start": "01/11/2021Z"},
                "name": "confirmed",
                "value": None,
            },
            {
                "dateRange": {"end": "01/05/2021Z", "start": "01/05/2021Z"},
                "name": "onsetSymptoms",
            },
            {
                "dateRange": {"end": "01/08/2021Z", "start": "01/08/2021Z"},
                "name": "hospitalAdmission",
                "value": "Yes",
            },
            {
                "dateRange": {"end": "01/12/2021Z", "start": "01/12/2021Z"},
                "name": "outcome",
                "value": "Death",
            },
        ],
        "location": {
            "administrativeAreaLevel1": "Santa Catarina",
            "administrativeAreaLevel2": "Florianópolis",
            "country": "Brazil",
            "geoResolution": "Admin2",
            "geometry": {"latitude": -27.57884066, "longitude": -48.50909204},
            "name": "Florianópolis, Santa Catarina, Brazil",
        },
        "preexistingConditions": {
            "hasPreexistingConditions": True,
            "values": ["asthma", "nervous system disease"],
        },
        "restrictedNotes": "Patient died from other causes",
        "symptoms": {"status": "Symptomatic", "values": ["dyspnea", "hypoxemia"]},
        "travelHistory": None,
    },
    {
        "caseReference": {"sourceId": "abc123", "sourceUrl": "foo.bar"},
        "demographics": {
            "ageRange": {"end": 55.0, "start": 55.0},
            "ethnicity": "White",
            "gender": "Female",
        },
        "events": [
            {
                "dateRange": {"end": "01/13/2021Z", "start": "01/13/2021Z"},
                "name": "confirmed",
                "value": "PCR test",
            },
            {
                "dateRange": {"end": "01/09/2021Z", "start": "01/09/2021Z"},
                "name": "onsetSymptoms",
            },
            {
                "dateRange": {"end": "01/13/2021Z", "start": "01/13/2021Z"},
                "name": "hospitalAdmission",
                "value": "Yes",
            },
            {"name": "icuAdmission", "value": "No"},
        ],
        "location": {
            "administrativeAreaLevel1": "São Paulo",
            "administrativeAreaLevel2": "São Paulo",
            "country": "Brazil",
            "geoResolution": "Admin2",
            "geometry": {"latitude": -23.65008109, "longitude": -46.64811076},
            "name": "São Paulo, São Paulo, Brazil",
        },
        "preexistingConditions": {
            "hasPreexistingConditions": True,
            "values": ["diabetes mellitus", "heart disease"],
        },
        "symptoms": {
            "status": "Symptomatic",
            "values": ["throat pain", "dyspnea", "fever", "cough", "hypoxemia"],
        },
        "travelHistory": None,
        "vaccines": [
            {"batch": "13141ax2", "date": "08/16/2021Z"},
            {"batch": "151234i", "date": "12/25/2021Z"},
        ],
    },
]


class BrazilSRAGTest(unittest.TestCase):
    def setUp(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 10000

    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = srag.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result), _EXPECTED)
