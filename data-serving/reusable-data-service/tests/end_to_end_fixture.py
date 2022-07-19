import pytest
import mongomock

from data_service import app
from data_service.main import set_up_controllers

@pytest.fixture
def client_with_patched_mongo(monkeypatch):
    # configure controllers
    monkeypatch.setenv("DATA_STORAGE_BACKEND", "mongodb")
    monkeypatch.setenv(
        "MONGO_CONNECTION_STRING", "mongodb://localhost:27017/outbreak"
    )  # will be unused
    monkeypatch.setenv("MONGO_DB", "outbreak")
    monkeypatch.setenv("MONGO_CASE_COLLECTION", "cases")
    monkeypatch.setenv("MONGO_SCHEMA_COLLECTION", "schema")
    monkeypatch.setenv("OUTBREAK_DATE", "2019-11-01")
    db = mongomock.MongoClient()

    def fake_mongo(connection_string):
        return db

    monkeypatch.setattr("pymongo.MongoClient", fake_mongo)
    set_up_controllers()
    app.config["TESTING"] = True
    client = app.test_client()
    yield client
