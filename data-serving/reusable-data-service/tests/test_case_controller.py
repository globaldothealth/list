import pytest
import json
from datetime import date
from typing import List

from reusable_data_service import Case, CaseController, app
from reusable_data_service.util.errors import (
    PreconditionUnsatisfiedError,
    UnsupportedTypeError,
    ValidationError,
)


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


def test_one_present_item_should_return_the_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
    response = case_controller.get_case("foo")
    assert response is not None
    assert response.confirmationDate == date(2021, 12, 31)


def test_one_absent_item_should_raise_KeyError(case_controller):
    with pytest.raises(KeyError):
        case_controller.get_case("foo")


def test_list_cases__when_there_are_none_should_return_empty_list(case_controller):
    cases = case_controller.list_cases()
    cases.cases == []


def test_list_cases_should_list_the_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
        case_controller.store.put_case("bar", case)
    cases = case_controller.list_cases()
    len(cases.cases) == 2


def test_list_cases_should_paginate(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    cases = case_controller.list_cases(page=1, limit=10)
    assert len(cases.cases) == 10
    assert cases.nextPage == 2
    assert cases.total == 15


def test_list_cases_last_page(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    cases = case_controller.list_cases(page=2, limit=10)
    assert len(cases.cases) == 5
    assert cases.total == 15
    assert cases.nextPage is None


def test_list_cases_nonexistent_page(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    cases = case_controller.list_cases(page=43, limit=10)
    assert len(cases.cases) == 0
    assert cases.total == 15
    assert cases.nextPage is None


def test_create_case_with_missing_properties_raises(case_controller):
    with pytest.raises(ValidationError):
        case_controller.create_case({})


def test_create_case_with_invalid_data_raises(case_controller):
    with pytest.raises(ValidationError):
        case_controller.create_case(
            {
                "confirmationDate": date(2001, 3, 17),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            }
        )


def test_create_valid_case_adds_to_collection(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        }
    )
    assert case_controller.store.count_cases() == 1


def test_create_valid_case_with_negative_count_raises(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, 3),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
            num_cases=-7,
        )


def test_create_valid_case_with_positive_count_adds_to_collection(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=7,
    )
    assert case_controller.store.count_cases() == 7


def test_validate_case_with_invalid_case_raises(case_controller):
    with pytest.raises(ValidationError):
        case_controller.validate_case_dictionary({})


def test_validate_case_with_valid_case_does_not_add_case(
    case_controller,
):
    case_controller.validate_case_dictionary(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        }
    )
    assert case_controller.store.count_cases() == 0


def test_batch_upsert_with_no_body_raises(case_controller):
    with pytest.raises(UnsupportedTypeError):
        case_controller.batch_upsert(None)


def test_batch_upsert_with_no_case_list_raises(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_upsert({})


def test_batch_upsert_with_empty_case_list_raises(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_upsert({"cases": []})


def test_batch_upsert_creates_valid_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        minimal_case_description = json.loads(minimal_file.read())
    response = case_controller.batch_upsert({"cases": [minimal_case_description]})
    assert case_controller.store.count_cases() == 1
    assert response.numCreated == 1
    assert response.numUpdated == 0
    assert response.errors == {}


def test_batch_upsert_reports_errors(case_controller):
    response = case_controller.batch_upsert({"cases": [{}]})
    assert response.numCreated == 0
    assert response.numUpdated == 0
    assert response.errors == {"0": "Confirmation Date is mandatory"}


def test_download_with_no_query_is_ok(case_controller):
    _ = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=2,
    )
    generator = case_controller.download(format="csv")
    result = ""
    for chunk in generator():
        result += chunk
    assert result.startswith(Case.csv_header())
    lines = result.splitlines()
    assert len(lines) == 3
