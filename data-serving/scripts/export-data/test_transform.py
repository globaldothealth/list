import io
import csv
import pytest
import json
from pathlib import Path
from contextlib import redirect_stdout
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

_EVENTS = [
    (
        {
            "name": "outcome",
            "value": "Recovered",
            "dateRange": {
                "start": {"$date": "2021-07-21T00:00:00.000Z"},
                "end": {"$date": "2021-07-21T00:00:00.000Z"},
            },
        },
        {"events.outcome.date": "2021-07-21", "events.outcome.value": "Recovered"},
    ),
    (
        {
            "name": "outcome",
            "value": "Death",
            "dateRange": {
                "start": {"$date": "2021-06-23T00:00:00.000Z"},
                "end": {"$date": "2021-06-23T00:00:00.000Z"},
            },
        },
        {"events.outcome.date": "2021-06-23", "events.outcome.value": "Death"},
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

_BUCKETS = [
    {
        "_id": "001",
        "start": 20,
        "end": 24,
    },
    {
        "_id": "002",
        "start": 25,
        "end": 29,
    }
]


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


@pytest.mark.parametrize("source,expected", _EVENTS)
def test_convert_event(source, expected):
    assert T.convert_event(source) == expected


def test_convert_travel():
    assert T.convert_travel(json.dumps(_TRAVEL)) == _TRAVEL_parsed


@pytest.mark.parametrize("fmt", ["csv", "tsv", "json"])
def test_transform_output_match(fmt):
    expected = Path(f'test_transform_mongoexport_expected.{fmt}').read_text()
    with redirect_stdout(io.StringIO()) as f:
        T.transform('test_transform_mongoexport.csv', '-', [fmt], "test_age_buckets.json")
    # use str.splitlines to ignore line endings

    expected_lines = expected.splitlines()
    actual_lines = f.getvalue().splitlines()

    lines_to_compare = zip(expected_lines, actual_lines)
    for line_pair in lines_to_compare:
        assert line_pair[0] == line_pair[1]


def test_transform_empty(tmp_path):
    output = f"{tmp_path}/empty"
    T.transform('test_transform_mongoexport_header.csv', output, ['csv'], "test_age_buckets.json")
    assert not Path(f"{output}.csv.gz").exists()


def test_transform_creates_output(tmp_path):
    formats = ['csv', 'tsv', 'json']
    output = f"{tmp_path}/output"
    T.transform('test_transform_mongoexport.csv', output, formats, "test_age_buckets.json")
    for fmt in formats:
        assert Path(f"{output}.{fmt}.gz").exists()


def test_transform_buckets_age_ranges():
    expected = Path(f'test_transform_mongoexport_bucketed_ages_expected.csv').read_text()
    with redirect_stdout(io.StringIO()) as f:
        T.transform('test_transform_mongoexport_bucketed_ages.csv', '-', ['csv'], 'test_age_buckets.json')

    expected_lines = expected.splitlines()
    actual_lines = f.getvalue().splitlines()

    lines_to_compare = zip(expected_lines, actual_lines)
    for line_pair in lines_to_compare:
        assert line_pair[0] == line_pair[1]


def test_age_bucket_conversion():
    case_buckets_json = "[\"001\", \"002\"]"
    (start, end) = T.age_range(case_buckets_json, _BUCKETS)
    assert start == 20
    assert end == 29


def test_age_bucket_row_conversion():
    row = {
        "_id": "ObjectId(abc123)",
        "travelHistory.traveledPrior30Days": "false",
        "demographics.ageBuckets": "[\"001\"]"
    }
    converted_row = T.convert_row(row, _BUCKETS)
    assert converted_row["demographics.ageRange.start"] == 20
    assert converted_row["demographics.ageRange.end"] == 24


@pytest.mark.parametrize("source,expected", [((22, 22),(21, 25)), ((58, 62),(56, 65)), ((130, 150), None)])
def test_get_age_bucket_as_range(source,expected):
    with Path(__file__).with_name("test_age_buckets.json").open() as fp:
        AGE_BUCKETS = json.load(fp)
    assert T.get_age_bucket_as_range(AGE_BUCKETS, *source) == expected
