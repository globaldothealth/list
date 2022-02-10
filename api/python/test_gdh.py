import pytest
import datetime
from gdh import stringify_filters, cases_cachefile


_STRINGIFY_FILTERS = [
    ({"country": "New Zealand"}, "country:'New Zealand'"),
    ({"country": "Argentina"}, "country:Argentina"),
]


@pytest.mark.parametrize("source,expected", _STRINGIFY_FILTERS)
def test_stringify_filters(source, expected):
    assert stringify_filters(**source) == expected


def test_cases_cachefile():
    assert (
        cases_cachefile(country="Belgium")
        == "cache/e6ee72213b1c28500279d56c119fb9eccb2d5c67b0b6167ca241980a3bfc7762.csv"
    )
