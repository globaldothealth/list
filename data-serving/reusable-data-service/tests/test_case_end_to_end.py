import pytest
import os
import mongomock
import pymongo

from reusable_data_service import app, set_up_controllers


@pytest.fixture
def client_with_patched_mongo(monkeypatch):
    # configure controllers
    monkeypatch.setenv("DATA_STORAGE_BACKEND", "mongodb")
    monkeypatch.setenv(
        "MONGO_CONNECTION_STRING", "mongodb://localhost/27017"
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
    db = pymongo.MongoClient("mongodb://localhost/27017")
    case_id = (
        db["outbreak"]["cases"]
        .insert_one({"confirmation_date": "2021-12-31T01:23:45.678Z"})
        .inserted_id
    )
    response = client_with_patched_mongo.get(f"/api/case/{str(case_id)}")
    result = response.get_json()
    assert response.status_code == 200
    assert result is not None
    assert result["confirmation_date"] == "2021-12-31T01:23:45.678Z"
