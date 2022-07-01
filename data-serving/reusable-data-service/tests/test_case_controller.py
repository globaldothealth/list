import pytest
import json
from datetime import date
from typing import List

from reusable_data_service import Case, CaseController, app


class MemoryStore:
    """Simple dictionary-based store for cases."""

    def __init__(self):
        self.cases = dict()
        self.next_id = 0

    def case_by_id(self, id: str):
        return self.cases.get(id)

    def put_case(self, id: str, case: Case):
        """This is test-only interface for populating the store."""
        self.cases[id] = case

    def insert_case(self, case: Case):
        """This is the external case insertion API that the case controller uses."""
        self.next_id += 1
        self.put_case(str(self.next_id), case)

    def fetch_cases(self, page: int, limit: int, *args):
        return list(self.cases.values())[(page - 1) * limit : page * limit]

    def count_cases(self, *args):
        return len(self.cases)

    def batch_upsert(self, cases: List[Case]):
        for case in cases:
            self.insert_case(case)
        return len(cases), 0

    def case_iterator(self, query):
        return iter(self.cases.values())


@pytest.fixture
def case_controller():
    with app.app_context():
        store = MemoryStore()
        controller = CaseController(app, store, outbreak_date=date(2019, 11, 1))
        yield controller


def test_one_present_item_should_return_200_OK(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
    (response, status) = case_controller.get_case("foo")
    assert status == 200
    assert response is not None


def test_one_absent_item_should_return_400_not_found(case_controller):
    (response, status) = case_controller.get_case("foo")
    assert status == 404
    assert response == "No case with ID foo"


def test_list_cases_should_return_200_OK(case_controller):
    (response, status) = case_controller.list_cases()
    assert status == 200
    assert response.json["cases"] == []


def test_list_cases_should_list_the_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
        case_controller.store.put_case("bar", case)
    (response, status) = case_controller.list_cases()
    assert status == 200
    assert len(response.json["cases"]) == 2


def test_list_cases_should_paginate(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    (response, status) = case_controller.list_cases(page=1, limit=10)
    assert status == 200
    assert len(response.json["cases"]) == 10
    assert response.json["nextPage"] == 2
    assert response.json["total"] == 15


def test_list_cases_last_page(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    (response, status) = case_controller.list_cases(page=2, limit=10)
    assert status == 200
    assert len(response.json["cases"]) == 5
    assert response.json["total"] == 15
    assert "nextPage" not in response.json


def test_list_cases_nonexistent_page(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    (response, status) = case_controller.list_cases(page=43, limit=10)
    assert status == 200
    assert len(response.json["cases"]) == 0
    assert response.json["total"] == 15
    assert "nextPage" not in response.json


def test_create_case_with_missing_properties_400_error(case_controller):
    (response, status) = case_controller.create_case({})
    assert status == 400


def test_create_case_with_invalid_data_422_error(case_controller):
    (response, status) = case_controller.create_case(
        {
            "confirmationDate": date(2001, 3, 17),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        }
    )
    assert status == 422


def test_create_valid_case_adds_to_collection(case_controller):
    (response, status) = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        }
    )
    assert status == 201
    assert case_controller.store.count_cases() == 1


def test_create_valid_case_with_negative_count_400_error(case_controller):
    (response, status) = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=-7,
    )
    assert status == 400


def test_create_valid_case_with_positive_count_adds_to_collection(case_controller):
    (response, status) = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=7,
    )
    assert status == 201
    assert case_controller.store.count_cases() == 7


def test_validate_case_with_invalid_case_is_400_error(case_controller):
    (response, status) = case_controller.validate_case_dictionary({})
    assert status == 400


def test_validate_case_with_valid_case_returns_204_and_does_not_add_case(
    case_controller,
):
    (response, status) = case_controller.validate_case_dictionary(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        }
    )
    assert status == 204
    assert case_controller.store.count_cases() == 0


def test_batch_upsert_with_no_body_returns_415(case_controller):
    (response, status) = case_controller.batch_upsert(None)
    assert status == 415


def test_batch_upsert_with_no_case_list_returns_400(case_controller):
    (response, status) = case_controller.batch_upsert({})
    assert status == 400


def test_batch_upsert_with_empty_case_list_returns_400(case_controller):
    (response, status) = case_controller.batch_upsert({"cases": []})
    assert status == 400


def test_batch_upsert_creates_valid_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        minimal_case_description = json.loads(minimal_file.read())
    (response, status) = case_controller.batch_upsert(
        {"cases": [minimal_case_description]}
    )
    assert status == 200
    assert case_controller.store.count_cases() == 1
    assert response.json["numCreated"] == 1
    assert response.json["numUpdated"] == 0
    assert response.json["errors"] == {}


def test_batch_upsert_reports_errors(case_controller):
    (response, status) = case_controller.batch_upsert({"cases": [{}]})
    assert status == 207
    assert response.json["numCreated"] == 0
    assert response.json["numUpdated"] == 0
    assert response.json["errors"] == {"0": "Confirmation Date is mandatory"}


def test_download_with_no_query_is_ok(case_controller):
    _ = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=2,
    )
    (response, status) = case_controller.download(format='csv')
    assert status == 200
    assert response.headers['Content-Type'] == 'text/csv; charset=utf-8'
    body = response.get_data().decode('utf-8')
    assert body.startswith(Case.csv_header())
    lines = body.splitlines()
    assert len(lines) == 3

