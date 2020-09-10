import json
import os
import pytest
import tempfile

from datetime import date


_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASE = (
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "HKD130",
            "sourceUrl": _SOURCE_URL
        },
        "location": {
            "query": "Sapporo, Hokkaido, Japan"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "2020-03-13",
                            "end": "2020-03-13"
                        }
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 50,
                "end": 59
            },
            "gender": "Female"
        },
        "notes": None
    })


@pytest.fixture()
def sample_data():
    """Loads sample source data from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "sample_data.json")
    with open(file_path) as event_file:
        return json.load(event_file)


def test_parse_cases_converts_fields_to_ghdsi_schema(sample_data):
    from japan import japan  # Import locally to avoid superseding mock
    with tempfile.NamedTemporaryFile("w") as f:
        json.dump(sample_data, f)
        f.flush()

        result = next(japan.parse_cases(f.name, _SOURCE_ID, _SOURCE_URL))
        assert result == _PARSED_CASE

