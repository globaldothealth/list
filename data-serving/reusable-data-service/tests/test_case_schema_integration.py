import csv
import io
import json

from tests.end_to_end_fixture import client_with_patched_mongo


def test_adding_field_then_downloading_case(client_with_patched_mongo):
    with open("./tests/data/case.minimal.json") as json_file:
        case_doc = json.load(json_file)
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "mySymptoms",
            "type": "string",
            "description": "A custom, comma-separated list of symptoms",
        },
    )
    assert response.status_code == 201

    case_doc["mySymptoms"] = "coughs, sneezles"

    response = client_with_patched_mongo.post(
        "/api/cases",
        json=case_doc,
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.get("/api/cases")
    assert response.status_code == 200
    case_list = response.get_json()
    assert case_list["total"] == 1
    assert len(case_list["cases"]) == 1
    assert case_list["cases"][0]["mySymptoms"] == "coughs, sneezles"


def test_adding_field_then_downloading_csv(client_with_patched_mongo):
    with open("./tests/data/case.minimal.json") as json_file:
        case_doc = json.load(json_file)
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "someField",
            "type": "string",
            "description": "Another custom field",
        },
    )
    assert response.status_code == 201

    case_doc["someField"] = "well, what have we here"
    response = client_with_patched_mongo.post(
        "/api/cases",
        json=case_doc,
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.post(
        "/api/cases/download", json={"format": "csv"}
    )
    assert response.status_code == 200
    csv_file = io.StringIO(response.get_data().decode("utf-8"))
    csv_reader = csv.DictReader(csv_file)
    cases = [c for c in csv_reader]
    assert len(cases) == 1
    case = cases[0]
    assert case["someField"] == "well, what have we here"


def test_required_field_default_value_spread_to_existing_cases(
    client_with_patched_mongo,
):
    with open("./tests/data/case.minimal.json") as json_file:
        case_doc = json.load(json_file)
    response = client_with_patched_mongo.post(
        "/api/cases",
        json=case_doc,
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "requiredField",
            "type": "string",
            "description": "You must supply a value for this",
            "default": "PENDING",
            "required": True,
        },
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.get("/api/cases")
    assert response.status_code == 200
    case_list = response.get_json()
    assert case_list["total"] == 1
    assert len(case_list["cases"]) == 1
    assert case_list["cases"][0]["requiredField"] == "PENDING"


def test_required_field_becomes_required_in_validation(client_with_patched_mongo):
    with open("./tests/data/case.minimal.json") as json_file:
        case_doc = json.load(json_file)
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "importantInformation",
            "type": "string",
            "description": "You must supply a value for this",
            "default": "PENDING",
            "required": True,
        },
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.post(
        "/api/cases",
        json=case_doc,
    )
    assert response.status_code == 422


def test_field_enumerating_allowed_values_forbids_other_value(
    client_with_patched_mongo,
):
    with open("./tests/data/case.minimal.json") as json_file:
        case_doc = json.load(json_file)
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "customPathogenStatus",
            "type": "string",
            "description": "Whether the infection is associated with an endemic or emerging incidence",
            "values": ["Endemic", "Emerging", "Unknown"],
            "required": False,
        },
    )
    assert response.status_code == 201

    case_doc["customPathogenStatus"] = "Something Else"

    response = client_with_patched_mongo.post(
        "/api/cases",
        json=case_doc,
    )
    assert response.status_code == 422


def test_adding_enumerated_field_with_other_value(client_with_patched_mongo):
    with open("./tests/data/case.minimal.json") as json_file:
        case_doc = json.load(json_file)
    response = client_with_patched_mongo.post(
        "/api/schema",
        json={
            "name": "customPathogenStatus",
            "type": "string",
            "description": "Whether the infection is associated with an endemic or emerging incidence",
            "values": ["Endemic", "Emerging", "Unknown", "other"],
            "required": False,
        },
    )
    assert response.status_code == 201

    case_doc["customPathogenStatus"] = "other"
    case_doc["customPathogenStatus_other"] = "Neopanspermia"
    response = client_with_patched_mongo.post(
        "/api/cases",
        json=case_doc,
    )
    assert response.status_code == 201
    response = client_with_patched_mongo.post(
        "/api/cases/download", json={"format": "csv"}
    )
    assert response.status_code == 200
    csv_file = io.StringIO(response.get_data().decode("utf-8"))
    csv_reader = csv.DictReader(csv_file)
    cases = [c for c in csv_reader]
    assert len(cases) == 1
    case = cases[0]
    assert case["customPathogenStatus_other"] == "Neopanspermia"
