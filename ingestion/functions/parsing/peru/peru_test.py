
import json
import os
import pytest
import tempfile
import pandas as pd

from datetime import date

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASE = (
{'caseReference': {'sourceId': 'abc123',
  'sourceEntryId': '7320cabdc1aaca6c59014cae76a134e6',
  'sourceUrl': 'https://foo.bar'},
 'revisionMetadata': {'revisionNumber': 0,
  'creationMetadata': {'curator': 'auto', 'date': '08/19/2020'}},
 'location': {'country': 'Peru',
  'administrativeAreaLevel1': 'AYACUCHO',
  'administrativeAreaLevel2': 'HUAMANGA',
  'administrativeAreaLevel3': 'AYACUCHO',
  'query': 'AYACUCHO, HUAMANGA, AYACUCHO, Peru'},
 'events': [{'name': 'confirmed',
   'dateRange': {'start': '07/24/2020', 'end': '07/24/2020'}}],
 'demographics': {'ageRange': {'start': 58.0, 'end': 58.0}, 'gender': 'Male'}
 }
 )


@pytest.fixture()
def sample_data():
    """Loads sample source data from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "sample_data.csv")
    with open(file_path) as event_file:
        return pd.read_csv(event_file)


def test_parse_cases_converts_fields_to_ghdsi_schema(sample_data):
    from peru import peru  # Import locally to avoid superseding mock
    with tempfile.NamedTemporaryFile("w") as f:
        # json.dump(sample_data, f)
        sample_data.to_csv(f)
        f.flush()

        result, = peru.parse_cases(f.name, _SOURCE_ID, _SOURCE_URL)
        assert result == _PARSED_CASE
