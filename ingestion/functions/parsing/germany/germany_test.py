import csv
import json
import os
import tempfile
import unittest
from datetime import date

import pytest

from germany import germany

_SOURCE_ID = "abc123"
_SOURCE_URL = "foo.bar"
_PARSED_CASE = [
   {
      "caseReference":{
         "sourceId":"abc123",
         "sourceUrl":"foo.bar"
      },
      "location":{
         "country":"Germany",
         "administrativeAreaLevel1":"Schleswig-Holstein",
         "administrativeAreaLevel2":"SK Flensburg",
         "geoResolution":"Admin2",
         "name":"SK Flensburg",
         "query":"Germany, Schleswig-Holstein, SK Flensburg"
      },
      "events":[
         {
            "name":"confirmed",
            "dateRange":{
               "start":"08/15/2020Z",
               "end":"08/15/2020Z"
            }
         }
      ],
      "demographics":{
         "gender":"Female",
         "ageRange":{
            "start":5.0,
            "end":14.0
         }
      }
   }
]


class GermanyTest(unittest.TestCase):
    def test_parse(self):
        # Default of 1500 is not enough to show diffs when there is one.
        self.maxDiff = 5000
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = germany.parse_cases(sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(result, _PARSED_CASE)
