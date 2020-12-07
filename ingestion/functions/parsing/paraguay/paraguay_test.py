import os
import unittest
from paraguay import paraguay

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://public.tableau.com/vizql/w/COVID19PY-Registros/v/Descargardatos/vudcsv/sessions/D8CB602652A24E009F367E19322820E5-0:0/views/7713620505763405234_2641841674343653269?showall=true&underlying_table_id=Migrated%20Data&underlying_table_caption=Full%20Data"

_PARSED_CASE = ({
    "caseReference": {
        "sourceId": "abc123",
        "sourceEntryId": "65794",
        "sourceUrl": "https://public.tableau.com/vizql/w/COVID19PY-Registros/v/Descargardatos/vudcsv/sessions/D8CB602652A24E009F367E19322820E5-0:0/views/7713620505763405234_2641841674343653269?showall=true&underlying_table_id=Migrated%20Data&underlying_table_caption=Full%20Data",
    },
    "location": {"query": "CIUDAD DEL ESTE, ALTO PARANA, Paraguay"},
    "events": [
        {
            "name": "confirmed",
            "dateRange": {"start": "11/06/2020Z", "end": "11/06/2020Z"},
        }
    ],
    "demographics": {
        "gender": "Male",
        "ageRange": {"start": 41.0, "end": 41.0}
    },
    "notes": "Patient was/is in quarantine",
})


class ParaguayTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = next(
            paraguay.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        )
        self.assertCountEqual([result], [_PARSED_CASE])