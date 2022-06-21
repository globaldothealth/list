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

    def all_cases(self):
        return list(self.cases.values())


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
    assert response.json == []


def test_list_cases_should_list_the_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
        case_controller.store.put_case("bar", case)
    (response, status) = case_controller.list_cases()
    assert status == 200
    assert len(response.json) == 2
