import pytest
import mongomock
import pymongo

from datetime import datetime

from reusable_data_service import app, set_up_controllers


@pytest.fixture
def client_with_patched_mongo(monkeypatch):
    # configure controllers
    monkeypatch.setenv("DATA_STORAGE_BACKEND", "mongodb")
    monkeypatch.setenv(
        "MONGO_CONNECTION_STRING", "mongodb://localhost:27017/outbreak"
    )  # will be unused
    monkeypatch.setenv("MONGO_DB", "outbreak")
    monkeypatch.setenv("MONGO_CASE_COLLECTION", "cases")
    db = mongomock.MongoClient()

    def fake_mongo(connection_string):
        return db

    monkeypatch.setattr("pymongo.MongoClient", fake_mongo)
    set_up_controllers()
    app.config["TESTING"] = True
    client = app.test_client()
    yield client


def test_get_case_with_known_id(client_with_patched_mongo):
    # insert a case
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    case_id = (
        db["outbreak"]["cases"]
        .insert_one({"confirmation_date": datetime(2021, 12, 31, 1, 23, 45, 678)})
        .inserted_id
    )
    response = client_with_patched_mongo.get(f"/api/cases/{str(case_id)}")
    result = response.get_json()
    assert response.status_code == 200
    assert result is not None
    assert result["confirmation_date"] == "2021-12-31"


def test_get_case_with_poorly_formatted_id(client_with_patched_mongo):
    response = client_with_patched_mongo.get(f"/api/cases/not_a_case_id")
    assert response.status_code == 404


def test_get_case_with_valid_absent_id(client_with_patched_mongo):
    response = client_with_patched_mongo.get(f"/api/cases/01234567890123456789abcd")
    assert response.status_code == 404


def test_list_cases_when_none_present_is_empty_list(client_with_patched_mongo):
    response = client_with_patched_mongo.get(f"/api/cases")
    assert response.status_code == 200
    assert response.json["cases"] == []


def test_list_cases_with_pagination_query(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [{"confirmation_date": datetime(2020, 12, 24)} for i in range(25)]
    )
    response = client_with_patched_mongo.get(f"/api/cases?page=2&limit=10")
    assert response.status_code == 200
    assert len(response.json["cases"]) == 10
    assert response.json["total"] == 25
    assert response.json["nextPage"] == 3


def test_list_cases_with_negative_page_rejected(client_with_patched_mongo):
    response = client_with_patched_mongo.get(f"/api/cases?page=-2")
    assert response.status_code == 400


def test_list_cases_with_negative_page_rejected(client_with_patched_mongo):
    response = client_with_patched_mongo.get(f"/api/cases?limit=-2")
    assert response.status_code == 400


def test_list_cases_filter_confirmation_date_before(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [{"confirmation_date": datetime(2022, 5, i)} for i in range(1, 32)]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedbefore%3a2022-05-10"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 9
    assert response.json["total"] == 9
    dates = [c["confirmation_date"] for c in response.json["cases"]]
    assert "2022-05-11" not in dates
    assert "2022-05-10" not in dates
    assert "2022-05-09" in dates


def test_list_cases_filter_confirmation_date_after(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [{"confirmation_date": datetime(2022, 5, i)} for i in range(1, 32)]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedafter%3a2022-05-10"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 10
    assert response.json["total"] == 21
    dates = [c["confirmation_date"] for c in response.json["cases"]]
    assert "2022-05-09" not in dates
    assert "2022-05-10" not in dates
    assert "2022-05-11" in dates


def test_list_cases_filter_confirmation_date_before_and_after(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [{"confirmation_date": datetime(2022, 5, i)} for i in range(1, 32)]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedafter%3a2022-05-10%20dateconfirmedbefore%3a2022-05-13"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 2
    assert response.json["total"] == 2
    dates = [c["confirmation_date"] for c in response.json["cases"]]
    assert "2022-05-10" not in dates
    assert "2022-05-11" in dates
    assert "2022-05-12" in dates
    assert "2022-05-13" not in dates


def test_list_cases_no_matching_results(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [{"confirmation_date": datetime(2022, 5, i)} for i in range(1, 32)]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedafter%3a2023-05-10"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 0
    assert response.json["total"] == 0
