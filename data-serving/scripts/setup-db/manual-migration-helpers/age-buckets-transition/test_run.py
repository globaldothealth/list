import os

import pytest
import pymongo

import run

AGE_BUCKETS = [
    {"_id": "0", "start": 0, "end": 0},
    {"_id": "1-5", "start": 1, "end": 5},
    {"_id": "6-10", "start": 6, "end": 10},
    {"_id": "11-15", "start": 11, "end": 15},
    {"_id": "16-20", "start": 16, "end": 20},
    {"_id": "21-25", "start": 21, "end": 25},
    {"_id": "26-30", "start": 26, "end": 30},
    {"_id": "31-35", "start": 31, "end": 35},
    {"_id": "36-40", "start": 36, "end": 40},
    {"_id": "41-45", "start": 41, "end": 45},
    {"_id": "46-50", "start": 46, "end": 50},
    {"_id": "51-55", "start": 51, "end": 55},
    {"_id": "56-60", "start": 56, "end": 60},
    {"_id": "61-65", "start": 61, "end": 65},
    {"_id": "66-70", "start": 66, "end": 70},
    {"_id": "71-75", "start": 71, "end": 75},
    {"_id": "76-80", "start": 76, "end": 80},
    {"_id": "81-85", "start": 81, "end": 85},
    {"_id": "86-90", "start": 86, "end": 90},
    {"_id": "91-95", "start": 91, "end": 95},
    {"_id": "96-100", "start": 96, "end": 100},
    {"_id": "101-105", "start": 101, "end": 105},
    {"_id": "106-110", "start": 106, "end": 110},
    {"_id": "111-115", "start": 111, "end": 115},
    {"_id": "116-120", "start": 116, "end": 120},
]

AGES = [(60, 60), (72, 80), (70, 79), (130, 140)]


@pytest.fixture
def db():
    client = pymongo.MongoClient(host="mongo")
    return client.covid19


@pytest.fixture
def age_buckets(db):
    db.ageBuckets.drop()
    db.ageBuckets.insert_many(AGE_BUCKETS)
    return {
        record["_id"]: (record["start"], record["end"])
        for record in db.ageBuckets.find()
    }


@pytest.fixture
def setup_cases(db):
    db.cases.drop()
    db.cases.insert_many(
        [
            {"list": True, "demographics": {"ageRange": {"start": start, "end": end}}}
            for start, end in AGES
        ]
    )


@pytest.mark.skipif(
    os.getenv("DOCKERIZED") is None,
    reason="Test disabled outside dockerized environment",
)
@pytest.mark.parametrize(
    "age_limits,expected",
    [
        ((60, 60), ["56-60"]),
        ((72, 80), ["71-75", "76-80"]),
        ((70, 79), ["66-70", "71-75", "76-80"]),
        ((130, 140), []),
    ],
)
def test_find_age_buckets(age_buckets, age_limits, expected):
    assert run.find_age_buckets(*age_limits, age_buckets) == expected


@pytest.mark.skipif(
    os.getenv("DOCKERIZED") is None,
    reason="Test disabled outside dockerized environment",
)
def test_migrate_age_buckets(db, setup_cases):
    run.migrate_age_buckets(db)
    # no demographics.ageRange should be present
    assert not list(
        db.cases.find({"list": True, "demographics.ageRange": {"$exists": True}})
    )
    assert [case["demographics"]["ageBuckets"] for case in db.cases.find()] == [
        ["56-60"],
        ["71-75", "76-80"],
        ["66-70", "71-75", "76-80"],
        [],
    ]
