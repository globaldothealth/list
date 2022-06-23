import pytest
from datetime import date

from reusable_data_service import Case, CaseController, app


class MemoryStore:
    """Simple dictionary-based store for cases."""

    def __init__(self):
        self.cases = dict()
        self.next_id = 0

    def case_by_id(self, id: str):
        return self.cases.get(id)

    def put_case(self, id: str, case: Case):
        """Used in the tests to populate the store."""
        self.cases[id] = case

    def insert_case(self, case: Case):
        """Used by the controller to insert a new case."""
        self.next_id += 1
        self.put_case(str(self.next_id), case)

    def fetch_cases(self, page: int, limit: int, *args):
        return list(self.cases.values())[(page - 1) * limit : page * limit]

    def count_cases(self, *args):
        return len(self.cases)


@pytest.fixture
def case_controller():
    with app.app_context():
        store = MemoryStore()
        controller = CaseController(store, outbreak_date=date(2019, 11, 1))
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
        {"confirmation_date": date(2001, 3, 17)}
    )
    assert status == 422


def test_create_valid_case_adds_to_collection(case_controller):
    (response, status) = case_controller.create_case(
        {"confirmation_date": date(2021, 6, 3)}
    )
    assert status == 201
    assert case_controller.store.count_cases() == 1


def test_create_valid_case_with_negative_count_400_error(case_controller):
    (response, status) = case_controller.create_case(
        {"confirmation_date": date(2021, 6, 3)},
        num_cases = -7
    )
    assert status == 400


def test_create_valid_case_with_positive_count_adds_to_collection(case_controller):
    (response, status) = case_controller.create_case(
        {"confirmation_date": date(2021, 6, 3)},
        num_cases = 7
    )
    assert status == 201
    assert case_controller.store.count_cases() == 7


def test_validate_case_with_invalid_case_is_400_error(case_controller):
    (response, status) = case_controller.validate_case_dictionary({})
    assert status == 400


def test_validate_case_with_valid_case_returns_204_and_does_not_add_case(case_controller):
    (response, status) = case_controller.validate_case_dictionary(
        {"confirmation_date": date(2021, 6, 3)}
    )
    assert status == 204
    assert case_controller.store.count_cases() == 0
