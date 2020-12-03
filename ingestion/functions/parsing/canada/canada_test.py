import json
import os
import pytest
import tempfile

from datetime import date

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASE = ({
    "caseReference": {
        "sourceId":
        _SOURCE_ID,
        "sourceEntryId":
        "1",
        "sourceUrl":
        _SOURCE_URL,
        "additionalSources": [
            "https://news.ontario.ca/mohltc/en/2020/01/ontario-confirms-first-case-of-wuhan-novel-coronavirus.html",
            "https://globalnews.ca/news/6497313/coronavirus-timeine-cases-canada/",
            "https://globalnews.ca/news/6462626/coronavirus-toronto-hospital/",
            "http://abc.xyz"
        ]
    },
    "location": {
        "query": "Toronto, Ontario, Canada"
    },
    "travelHistory": {
        "travelledPrior30Days":
        True,
        "travel": [{
            "location": {
                "query": "Japan"
            }
        }, {
            "location": {
                "query": "China"
            }
        }]
    },
    "events": [{
        "name": "confirmed",
        "dateRange": {
            "start": "01/25/2020",
            "end": "01/25/2020"
        }
    }],
    "demographics": {
        "ageRange": {
            "start": 50,
            "end": 59
        },
        "gender": "Male"
    },
    "notes":
    None
})


@pytest.fixture()
def sample_data():
    """Loads sample source data from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "sample_data.csv")
    with open(file_path) as event_file:
        return event_file.read()


def test_parse_cases_converts_fields_to_ghdsi_schema(sample_data):
    from canada import canada  # Import locally to avoid superseding mock
    with tempfile.NamedTemporaryFile("w") as f:
        f.write(sample_data)
        f.flush()

        result, = canada.parse_cases(f.name, _SOURCE_ID, _SOURCE_URL)
        assert result == _PARSED_CASE
