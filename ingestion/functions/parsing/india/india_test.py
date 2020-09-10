
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
            "sourceEntryId": "48765",
            "sourceUrl": _SOURCE_URL
        },
        "location": {
            "country": "India",
            "administrativeAreaLevel1": "Bihar",
            "administrativeAreaLevel2": "Darbhanga",
            "administrativeAreaLevel3": "Hanuman Nagar",
            "query": "Hanuman Nagar, Darbhanga, Bihar, India"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "06/05/2020Z",
                            "end": "06/05/2020Z"
                        }
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 65,
                "end": 65
            },
            "gender": "Male"
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
    from india import india  # Import locally to avoid superseding mock
    with tempfile.NamedTemporaryFile("w") as f:
        json.dump(sample_data, f)
        f.flush()

        result = next(india.parse_cases(f.name, _SOURCE_ID, _SOURCE_URL))
        assert result == _PARSED_CASE
