import json

import pandas as pd
import app

_JHU_DATA = "tests/jhu-02-02-2022.csv"

_REGIONS_TRANSFORMED = [
    {
        "_id": "Visakhapatnam",
        "admin1": "Andhra Pradesh",
        "admin2": "Visakhapatnam",
        "admin3": "Visakhapatnam",
        "casecount": 14,
        "country": "India",
        "country_code": "IN",
        "lat": 17.7,
        "long": 83.25,
        "search": "admin3",
    },
    {
        "_id": "Rockbridge County",
        "admin1": "Virginia",
        "admin2": "Rockbridge County",
        "admin3": None,
        "casecount": 1,
        "country": "United States of America",
        "country_code": "US",
        "lat": 37.8172678,
        "long": -79.44573100000002,
        "search": "admin2",
    },
    {
        "_id": "Austria",
        "admin1": None,
        "admin2": None,
        "admin3": None,
        "casecount": 146,
        "country": "Austria",
        "country_code": "AT",
        "lat": 48.00644000000007,
        "long": 16.232610000000022,
        "search": "country",
    },
    {
        "_id": "Mossâmedes",
        "admin1": "Goiás",
        "admin2": "Mossâmedes",
        "admin3": "Mossâmedes",
        "casecount": 33,
        "country": "Brazil",
        "country_code": "BR",
        "lat": -16.1264,
        "long": -50.2104,
        "search": "admin3",
    },
    {
        "_id": "Azores",
        "admin1": "Azores",
        "admin2": None,
        "admin3": None,
        "casecount": 11,
        "country": "Portugal",
        "country_code": "PT",
        "lat": 37.794594,
        "long": -25.506134,
        "search": "admin1",
    },
]

_COUNTS_TRANSFORMED = [
    {
        "_id": "SI",
        "casecount": 1496,
        "code": "SI",
        "jhu": 745980,
        "lat": 46.151241,
        "long": 14.995463,
    },
    {
        "_id": "TN",
        "casecount": 2,
        "code": "TN",
        "jhu": 917814,
        "lat": 33.886917,
        "long": 9.537499,
    },
    {
        "_id": "DE",
        "casecount": 8074527,
        "code": "DE",
        "jhu": 10474992,
        "lat": 51.165691,
        "long": 10.451526,
    },
    {
        "_id": "US",
        "casecount": 30261846,
        "code": "US",
        "jhu": 75716592,
        "lat": 37.09024,
        "long": -95.712891,
    },
    {
        "_id": "VC",
        "casecount": 1,
        "code": "VC",
        "jhu": 7939,
        "lat": 12.984305,
        "long": -61.287228,
    },
]

_COUNTS_CSV_DATA = [
    {
        "casecount_gh": 1496,
        "casecount_jhu": 745980,
        "country": "Slovenia",
        "coverage": "0%",
        "data": "https://data.covid-19.global.health/cases?country=SI",
        "map": "https://map.covid-19.global.health/#country/SI",
    },
    {
        "casecount_gh": 2,
        "casecount_jhu": 917814,
        "country": "Tunisia",
        "coverage": "0%",
        "data": "https://data.covid-19.global.health/cases?country=TN",
        "map": "https://map.covid-19.global.health/#country/TN",
    },
    {
        "casecount_gh": 8074527,
        "casecount_jhu": 10474992,
        "country": "Germany",
        "coverage": "77%",
        "data": "https://data.covid-19.global.health/cases?country=DE",
        "map": "https://map.covid-19.global.health/#country/DE",
    },
    {
        "casecount_gh": 30261846,
        "casecount_jhu": 75716592,
        "country": "United States of America",
        "coverage": "40%",
        "data": "https://data.covid-19.global.health/cases?country=US",
        "map": "https://map.covid-19.global.health/#country/US",
    },
    {
        "casecount_gh": 1,
        "casecount_jhu": 7939,
        "country": "Saint Vincent and the Grenadines",
        "coverage": "0%",
        "data": "https://data.covid-19.global.health/cases?country=VC",
        "map": "https://map.covid-19.global.health/#country/VC",
    },
]


def test_transform_regions():
    with open("tests/regions-aggregate.json") as fp:
        regions = json.load(fp)
        assert app.transform_regions(regions) == _REGIONS_TRANSFORMED


def test_transform_counts():
    with open("tests/casecount-aggregate.json") as fp:
        counts = json.load(fp)
        assert (
            app.transform_counts(
                counts, app.transform_jhu_counts(pd.read_csv(_JHU_DATA))
            )
            == _COUNTS_TRANSFORMED
        )


def test_count_dataframe():
    with open("tests/casecount-aggregate.json") as fp:
        counts = app.transform_counts(
            json.load(fp), app.transform_jhu_counts(pd.read_csv(_JHU_DATA))
        )
    actual = app.counts_dataframe(
        counts,
        "https://data.covid-19.global.health",
        "https://map.covid-19.global.health",
    )
    expected = pd.DataFrame(_COUNTS_CSV_DATA).reindex(
        columns=["country", "data", "map", "casecount_gh", "casecount_jhu", "coverage"]
    )
    assert actual.equals(expected)
