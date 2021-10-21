import csv
import pytest
import json
from pprint import pprint
import transform as T

_DEEP_GET = [
    ({"x": {"y": {"z": 2}}}, "x.y.z", 2),
    ({"x": {"y": [1, 2]}}, "x.y", [1, 2]),
]

_ADDITIONAL_SOURCES = [
    ("[]", None),
    (
        '[{"sourceUrl": "http://foo.bar"}, {"sourceUrl": "http://bar.baz"}]',
        "http://foo.bar,http://bar.baz",
    ),
]

_TRAVEL = [
    {
        "dateRange": {"start": "2021-10-10T00:00:00Z", "end": "2021-10-12T00:00:00Z"},
        "location": {
            "geometry": {"latitude": 35, "longitude": -31},
            "administrativeAreaLevel1": "Port",
            "country": "Atlantis",
            "name": "Port of Atlantis",
        },
        "methods": "Ship",
    },
    {
        "dateRange": {"start": "2021-10-13T00:00:00Z", "end": "2021-10-15T00:00:00Z"},
        "location": {
            "geometry": {"latitude": 35, "longitude": -31},
            "administrativeAreaLevel1": "Coast",
            "country": "Atlantis",
            "name": "Coast",
        },
        "methods": "Raft",
    },
]

_TRAVEL_parsed = {
    "travelHistory.travel.dateRange.end": "2021-10-12,2021-10-15",
    "travelHistory.travel.dateRange.start": "2021-10-10,2021-10-13",
    "travelHistory.travel.location.administrativeAreaLevel1": "Port,Coast",
    "travelHistory.travel.location.country": "Atlantis,Atlantis",
    "travelHistory.travel.location.geometry.coordinates": "(35, -31),(35, -31)",
    "travelHistory.travel.location.name": "Port of Atlantis,Coast",
    "travelHistory.travel.methods": "Ship,Raft",
}

def _read_csv(fn):
    with open(fn) as f:
        c = csv.DictReader(f)
        return [row for row in c]

@pytest.mark.parametrize("dictionary,key,value", _DEEP_GET)
def test_deep_get(dictionary, key, value):
    assert T.deep_get(dictionary, key) == value


@pytest.mark.parametrize("sources,expected", _ADDITIONAL_SOURCES)
def test_convert_addl_sources(sources, expected):
    assert T.convert_addl_sources(sources) == expected


def test_convert_travel():
    assert T.convert_travel(json.dumps(_TRAVEL)) == _TRAVEL_parsed


def test_convert_row():
    output = [T.convert_row(r) for r in _read_csv("test_transform_mongoexport.csv")]
    with open("test_transform_expected.json") as f:
        expected = json.load(f)
    assert output == expected
