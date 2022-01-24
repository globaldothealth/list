import pytest

import freshness


_LAST_UPLOAD = [
    {"created": "2021-11-01T00:00:00Z", "accepted": False, "status": "IN_PROGRESS"},
    {"created": "2021-10-30T00:00:00Z", "accepted": False, "status": "SUCCESS"},
    {"created": "2021-10-26T00:00:00Z", "accepted": False, "status": "ERROR"},
    {"created": "2021-10-24T00:00:00Z", "accepted": True, "status": "SUCCESS"},
    {"created": "2021-10-20T00:00:00Z", "accepted": False, "status": "ERROR"},
    {"created": "2021-10-10T00:00:00Z", "accepted": True, "status": "SUCCESS"},
]


def test_last_upload_created():
    assert freshness.last_upload_created(_LAST_UPLOAD) == "2021-10-24T00:00:00Z"


_SOURCES = {
    "sources": [
        {
            "countryCodes": ["BR"],
            "name": "Brazil State 1",
            "origin": {"url": "https://state1.gov.br/data.csv"},
            "uploads": [
                {
                    "accepted": True,
                    "created": "2022-01-18T00:00:00Z",
                    "status": "SUCCESS",
                },
                {
                    "accepted": False,
                    "created": "2022-01-15T00:00:00Z",
                    "status": "SUCCESS",
                },
                {
                    "accepted": False,
                    "created": "2022-01-11T00:00:00Z",
                    "status": "IN_PROGRESS",
                },
            ],
        },
        {
            "countryCodes": ["BR"],
            "name": "Brazil State 2",
            "origin": {"url": "https://state2.gov.br/data.csv"},
            "uploads": [
                {
                    "accepted": True,
                    "created": "2022-01-17T00:00:00Z",
                    "status": "SUCCESS",
                },
                {
                    "accepted": False,
                    "created": "2022-01-15T00:00:00Z",
                    "status": "SUCCESS",
                },
                {
                    "accepted": False,
                    "created": "2022-01-11T00:00:00Z",
                    "status": "IN_PROGRESS",
                },
            ],
        },
        {
            "countryCodes": ["US"],
            "name": "United States",
            "origin": {"url": "https://cdc.gov/rows.csv"},
            "uploads": [
                {
                    "accepted": True,
                    "created": "2021-11-11T00:00:00Z",
                    "status": "SUCCESS",
                },
                {
                    "accepted": False,
                    "created": "2021-09-01T00:00:00Z",
                    "status": "SUCCESS",
                },
                {
                    "accepted": False,
                    "created": "2021-07-15T00:00:00Z",
                    "status": "IN_PROGRESS",
                },
            ],
        },
        {
            "countryCodes": ["ZZ"],
            "name": "Spreadsheets imported data",
            "origin": {"url": "https://global.health"},
            "uploads": [],
        },
    ],
    "total": 4,
}

_FRESHNESS = {
    "BR": [
        {
            "last_upload": "2022-01-18T00:00:00Z",
            "name": "Brazil State 1",
            "url": "https://state1.gov.br/data.csv",
        },
        {
            "last_upload": "2022-01-17T00:00:00Z",
            "name": "Brazil State 2",
            "url": "https://state2.gov.br/data.csv",
        },
    ],
    "US": [
        {
            "last_upload": "2021-11-11T00:00:00Z",
            "name": "United States",
            "url": "https://cdc.gov/rows.csv",
        }
    ],
    "ZZ": [
        {
            "last_upload": None,
            "name": "Spreadsheets imported data",
            "url": "https://global.health",
        }
    ],
}


def test_freshness():
    assert freshness.freshness(_SOURCES["sources"]) == _FRESHNESS
