import os
import unittest

from example import example

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://some.url"
_PARSED_CASE = (
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceUrl": _SOURCE_URL,
        },
        "location": {
            "query": "Some district, Some country",
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "03/06/2020Z",
                            "end": "03/06/2020Z",
                        },
            },
        ],
    })


class ExampleTest(unittest.TestCase):
    def test_parse(self):
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = example.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertEqual(next(result), _PARSED_CASE)
