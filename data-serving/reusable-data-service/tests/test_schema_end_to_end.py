import pymongo
from tests.end_to_end_fixture import client_with_patched_mongo

from data_service.model.field import Field


def test_adding_field_from_api_call(client_with_patched_mongo):
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "fieldName",
            "type": "string",
            "description": "I want to add a field!",
        },
    )
    assert response.status_code == 201
    db = pymongo.MongoClient("mongodb://localhost:27017/outbreak")
    fields = [doc for doc in db["outbreak"]["schema"].find({})]
    assert len(fields) == 1
    added_field = fields[0]
    assert added_field["key"] == "fieldName"
    assert added_field["type"] == Field.STRING
    assert added_field["data_dictionary_text"] == "I want to add a field!"
