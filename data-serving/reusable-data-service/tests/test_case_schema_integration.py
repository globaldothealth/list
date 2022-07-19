from tests.end_to_end_fixture import client_with_patched_mongo

def test_adding_field_then_downloading_case(client_with_patched_mongo):
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "mySymptoms",
            "type": "string",
            "description": "A custom, comma-separated list of symptoms",
        },
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.post(
        "/api/cases",
        json={
            "confirmationDate": "2022-06-01T00:00:00.000Z",
            "caseReference": {
                "status": "UNVERIFIED",
                "sourceId": "24680135792468013579fedc"
            },
            "mySymptoms": "coughs, sneezles"
        },
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.get(
        "/api/cases"
    )
    assert response.status_code == 200
    case_list = response.get_json()
    assert case_list["total"] == 1
    assert len(case_list["cases"]) == 1
    assert case_list["cases"][0]["mySymptoms"] == "coughs, sneezles"
