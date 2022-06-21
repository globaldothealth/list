import pytest

from reusable_data_service import Case, CaseController, app


class MemoryStore:
    """Simple dictionary-based store for cases."""

    def __init__(self):
        self.cases = dict()

    def case_by_id(self, id: str):
        return self.cases.get(id)

    def put_case(self, id: str, case: Case):
        self.cases[id] = case

    def fetch_cases(self, page: int, limit: int):
        return list(self.cases.values())[(page - 1) * limit: page * limit]

    def count_cases(self):
        return len(self.cases)

@pytest.fixture
def case_controller():
    with app.app_context():
        store = MemoryStore()
        controller = CaseController(store)
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

