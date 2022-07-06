import pytest
import mongomock

from bson import ObjectId
from datetime import date

from data_service.model.case import Case
from data_service.model.case_reference import CaseReference
from data_service.model.filter import Anything
from data_service.stores.mongo_store import MongoStore


@pytest.fixture
def mongo_store(monkeypatch):
    db = mongomock.MongoClient()

    def fake_mongo(connection_string):
        return db

    monkeypatch.setattr("pymongo.MongoClient", fake_mongo)
    store = MongoStore("mongodb://localhost:27017/outbreak", "outbreak", "cases")
    yield store


"""
Note that mongomock gets the inserted and updated counts of bulk write actions incorrect
(it seems to always consider ReplaceOne operations as updates, even if they insert).
So these tests don't read those values, they test the state of the database.
"""


def test_store_inserts_case_with_no_case_reference(mongo_store):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    (created, updated) = mongo_store.batch_upsert([case])
    assert mongo_store.count_cases(Anything()) == 1


def test_store_inserts_case_with_empty_case_reference(mongo_store):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    case.caseReference = CaseReference()
    (created, updated) = mongo_store.batch_upsert([case])
    assert mongo_store.count_cases(Anything()) == 1


def test_store_inserts_case_with_populated_case_reference(mongo_store):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    caseReference = CaseReference()
    caseReference.sourceId = ObjectId()
    caseReference.sourceEntryId = "1234"
    case.caseReference = caseReference
    (created, updated) = mongo_store.batch_upsert([case])
    assert mongo_store.count_cases(Anything()) == 1


def test_store_inserts_case_even_with_known_case_reference(mongo_store):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    caseReference = CaseReference()
    caseReference.sourceId = ObjectId()
    caseReference.sourceEntryId = "1234"
    case.caseReference = caseReference
    mongo_store.insert_case(case)
    case.confirmation_date = date(2022, 1, 13)
    (created, updated) = mongo_store.batch_upsert([case])
    assert mongo_store.count_cases(Anything()) == 2


def test_batch_upsert_updates_case_with_existing_object_id(mongo_store):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        minimal_case = Case.from_json(minimal_file.read())
    mongo_store.insert_case(minimal_case)
    retrieved_case = mongo_store.fetch_cases(1, 10, Anything())[0]
    retrieved_case.confirmationDate = date(2021, 6, 19)
    (created, updated) = mongo_store.batch_upsert([retrieved_case])
    assert mongo_store.count_cases(Anything()) == 1
