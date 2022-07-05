import pytest
import bson
import mongomock
import pymongo

from datetime import datetime

from data_service import app, set_up_controllers


@pytest.fixture
def client_with_patched_mongo(monkeypatch):
    # configure controllers
    monkeypatch.setenv("DATA_STORAGE_BACKEND", "mongodb")
    monkeypatch.setenv(
        "MONGO_CONNECTION_STRING", "mongodb://localhost:27017/outbreak"
    )  # will be unused
    monkeypatch.setenv("MONGO_DB", "outbreak")
    monkeypatch.setenv("MONGO_CASE_COLLECTION", "cases")
    monkeypatch.setenv("OUTBREAK_DATE", "2019-11-01")
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
        .insert_one(
            {
                "confirmationDate": datetime(2021, 12, 31, 1, 23, 45, 678),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
        )
        .inserted_id
    )
    response = client_with_patched_mongo.get(f"/api/cases/{str(case_id)}")
    result = response.get_json()
    assert response.status_code == 200
    assert result is not None
    assert result["confirmationDate"] == "2021-12-31"


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
        [
            {
                "confirmationDate": datetime(2020, 12, 24),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(25)
        ]
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
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 32)
        ]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedbefore%3a2022-05-10"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 9
    assert response.json["total"] == 9
    dates = [c["confirmationDate"] for c in response.json["cases"]]
    assert "2022-05-11" not in dates
    assert "2022-05-10" not in dates
    assert "2022-05-09" in dates


def test_list_cases_filter_confirmation_date_after(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 32)
        ]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedafter%3a2022-05-10"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 10
    assert response.json["total"] == 21
    dates = [c["confirmationDate"] for c in response.json["cases"]]
    assert "2022-05-09" not in dates
    assert "2022-05-10" not in dates
    assert "2022-05-11" in dates


def test_list_cases_filter_confirmation_date_before_and_after(
    client_with_patched_mongo,
):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 32)
        ]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedafter%3a2022-05-10%20dateconfirmedbefore%3a2022-05-13"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 2
    assert response.json["total"] == 2
    dates = [c["confirmationDate"] for c in response.json["cases"]]
    assert "2022-05-10" not in dates
    assert "2022-05-11" in dates
    assert "2022-05-12" in dates
    assert "2022-05-13" not in dates


def test_list_cases_no_matching_results(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 32)
        ]
    )
    response = client_with_patched_mongo.get(
        f"/api/cases?q=dateconfirmedafter%3a2023-05-10"
    )
    assert response.status_code == 200
    assert len(response.json["cases"]) == 0
    assert response.json["total"] == 0


def test_list_cases_with_bad_filter_rejected(client_with_patched_mongo):
    response = client_with_patched_mongo.get("/api/cases?q=country%3A")
    assert response.status_code == 422


def test_post_case_list_cases_round_trip(client_with_patched_mongo):
    post_response = client_with_patched_mongo.post(
        "/api/cases",
        json={
            "confirmationDate": "2022-01-23T13:45:01.234Z",
            "caseReference": {"sourceId": bson.ObjectId("fedc12345678901234567890")},
        },
    )
    assert post_response.status_code == 201
    get_response = client_with_patched_mongo.get("/api/cases")
    assert get_response.status_code == 200
    assert len(get_response.json["cases"]) == 1
    assert get_response.json["cases"][0]["confirmationDate"] == "2022-01-23"


def test_post_multiple_case_list_cases_round_trip(client_with_patched_mongo):
    post_response = client_with_patched_mongo.post(
        "/api/cases?num_cases=3",
        json={
            "confirmationDate": "2022-01-23T13:45:01.234Z",
            "caseReference": {"sourceId": bson.ObjectId("fedc12345678901234567890")},
        },
    )
    assert post_response.status_code == 201
    get_response = client_with_patched_mongo.get("/api/cases")
    assert get_response.status_code == 200
    assert len(get_response.json["cases"]) == 3
    assert get_response.json["cases"][0]["confirmationDate"] == "2022-01-23"


def test_post_case_validate_only(client_with_patched_mongo):
    post_response = client_with_patched_mongo.post(
        "/api/cases?validate_only=true",
        json={
            "confirmationDate": "2022-01-23T13:45:01.234Z",
            "caseReference": {"sourceId": bson.ObjectId("fedc12345678901234567890")},
        },
    )
    assert post_response.status_code == 204
    get_response = client_with_patched_mongo.get("/api/cases")
    assert get_response.status_code == 200
    assert len(get_response.json["cases"]) == 0


def test_batch_upsert_case(client_with_patched_mongo):
    post_response = client_with_patched_mongo.post(
        "/api/cases/batchUpsert",
        json={
            "cases": [
                {
                    "confirmationDate": "2022-01-23T13:45:01.234Z",
                    "caseReference": {
                        "sourceId": "abcd12345678901234567890",
                    },
                }
            ]
        },
    )
    assert post_response.status_code == 200
    assert post_response.json["errors"] == {}
    # mongomock doesn't correctly track upserts for creation/replacement, so can't test numCreated/numUpdated
    get_response = client_with_patched_mongo.get("/api/cases")
    assert get_response.status_code == 200
    assert len(get_response.json["cases"]) == 1


def test_download_all_cases_csv(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 4)
        ]
    )
    post_response = client_with_patched_mongo.post(
        "/api/cases/download", json={"format": "csv"}
    )
    assert post_response.status_code == 200
    string = post_response.get_data().decode("utf-8")
    assert "2022-05-01" in string


def test_download_selected_cases_tsv(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    db["outbreak"]["cases"].insert_many(
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 4)
        ]
    )
    post_response = client_with_patched_mongo.post(
        "/api/cases/download",
        json={"format": "tsv", "query": "dateconfirmedbefore:2022-05-02"},
    )
    assert post_response.status_code == 200
    string = post_response.get_data().decode("utf-8")
    assert "2022-05-01" in string
    assert "\t" in string
    assert "2022-05-03" not in string


def test_download_selected_cases_tsv(client_with_patched_mongo):
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    inserted = db["outbreak"]["cases"].insert_many(
        [
            {
                "confirmationDate": datetime(2022, 5, i),
                "caseReference": {
                    "sourceId": bson.ObjectId("fedc12345678901234567890")
                },
            }
            for i in range(1, 4)
        ]
    )
    ids = [str(anId) for anId in inserted.inserted_ids]
    post_response = client_with_patched_mongo.post(
        "/api/cases/download",
        json={"format": "json", "caseIds": [ids[0], ids[2]]},
    )
    assert post_response.status_code == 200
    cases = post_response.json
    assert len(cases) == 2
    assert cases[0]["confirmationDate"] == "2022-05-01"
    assert cases[1]["confirmationDate"] == "2022-05-03"
