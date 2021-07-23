import os
import unittest
from brazil_distrito_federal import distrito_federal

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://covid19.ssp.df.gov.br/resources/dados/dados-abertos.csv?param=[random]"
_PARSED_CASE = ({
    "caseReference": {
        "sourceId": "abc123",
        "sourceUrl": "https://covid19.ssp.df.gov.br/resources/dados/dados-abertos.csv?param=[random]",
    },
    "location": {
        "place": "Lago Sul",
        "country": "Brazil",
        "administrativeAreaLevel1": "Distrito Federal",
        "geoResolution": "Point",
        "name": "Lago Sul, Distrito Federal, Brazil",
        "geometry": {
            "latitude": -15.8428,
            "longitude": -47.8778
        }
    },
    "events": [
        {
            "name": "confirmed",
            "dateRange": {"start": "03/18/2020Z", "end": "03/18/2020Z"},
        },
        {
            "name": "onsetSymptoms",
            "dateRange": {"start": "02/26/2020Z", "end": "02/26/2020Z"},
        }
    ],
    "demographics": {
        "gender": "Female",
        "ageRange": {"start": 50.0, "end": 59.0}
    },
    "preexistingConditions": {"hasPreexistingConditions": True, "values": ["disease of metabolism", "obesity"]},
    "restrictedNotes": "Patient with immunosuppression",
})


class DFTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = next(
            distrito_federal.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        )
        self.assertCountEqual([result], [_PARSED_CASE])