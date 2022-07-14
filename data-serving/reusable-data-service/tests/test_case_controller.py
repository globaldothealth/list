import freezegun
import pytest
import json

from datetime import date
from typing import List, Optional

from data_service import app
from data_service.controller.case_controller import CaseController
from data_service.model.case import Case
from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.document_update import DocumentUpdate
from data_service.util.errors import (
    NotFoundError,
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
        id = str(self.next_id)
        case._id = id
        self.put_case(id, case)

    def replace_case(self, id: str, case: Case):
        self.put_case(id, case)

    def update_case(self, id: str, update: DocumentUpdate):
        case = self.case_by_id(id)
        case.apply_update(update)

    def batch_update(self, updates: dict[str, DocumentUpdate]):
        for id, update in iter(updates.items()):
            self.update_case(id, update)
        return len(updates)

    def update_case_status(
        self, id: str, status: str, exclusion: CaseExclusionMetadata
    ):
        case = self.case_by_id(id)
        case.caseReference.status = status
        case.caseExclusion = exclusion

    def fetch_cases(self, page: int, limit: int, *args):
        return list(self.cases.values())[(page - 1) * limit : page * limit]

    def count_cases(self, *args):
        return len(self.cases)

    def batch_upsert(self, cases: List[Case]):
        for case in cases:
            self.insert_case(case)
        return len(cases), 0

    def excluded_cases(self, source_id: str, filter: Optional[str] = None):
        return [
            c
            for c in self.cases.values()
            if c.caseReference.sourceId == source_id
            and c.caseReference.status == "EXCLUDED"
        ]

    def delete_case(self, source_id: str):
        del self.cases[source_id]
    
    def delete_cases(self, query):
        self.cases = dict()

    def matching_case_iterator(self, query):
        return iter(self.cases.values())

    def identified_case_iterator(self, case_ids):
        ids_as_ints = [int(x) for x in case_ids]
        all_cases = list(self.cases.values())
        matching_cases = [all_cases[i] for i in ids_as_ints]
        return iter(matching_cases)


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


def test_one_absent_item_should_raise_NotFoundError(case_controller):
    with pytest.raises(NotFoundError):
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
    assert len(cases.cases) == 2


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


def test_download_with_malformed_query_throws(case_controller):
    with pytest.raises(ValidationError):
        case_controller.download("csv", "country:")


def test_download_with_unsupported_format_throws(case_controller):
    with pytest.raises(UnsupportedTypeError):
        case_controller.download(format="docx")


def test_download_with_query_and_case_ids_throws(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.download(format="csv", filter="country:IN", case_ids=["1"])


def test_download_cases_by_id(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    generator = case_controller.download("csv", case_ids=["1", "3"])
    result = ""
    for chunk in generator():
        result += chunk
    assert "2021-06-02" in result
    assert "2021-06-03" not in result
    assert "2021-06-04" in result


def test_filter_cases_by_query(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    generator = case_controller.download("csv", filter="dateconfirmedbefore:2021-06-03")
    result = ""
    for chunk in generator():
        result += chunk
    # test double version of the store doesn't actually filter by case ID so just check we get the CSV back
    assert result.startswith(Case.csv_header())


def test_download_supports_tsv(case_controller):
    _ = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=2,
    )
    generator = case_controller.download(format="tsv")
    result = ""
    for chunk in generator():
        result += chunk
    assert result.startswith(Case.tsv_header())
    lines = result.splitlines()
    assert len(lines) == 3


def test_download_supports_json(case_controller):
    _ = case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 3),
            "caseReference": {"sourceId": "123ab4567890123ef4567890"},
        },
        num_cases=2,
    )
    generator = case_controller.download(format="json")
    output = ""
    for chunk in generator():
        output += chunk
    result = json.loads(output)
    assert len(result) == 2
    assert result[0]["confirmationDate"] == "2021-06-03"
    assert result[1]["caseReference"]["sourceId"] == "123ab4567890123ef4567890"


def test_batch_status_change_rejects_invalid_status(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_status_change("xxx", case_ids=[])


def test_batch_status_change_rejects_exclusion_with_no_note(case_controller):
    with pytest.raises(ValidationError):
        case_controller.batch_status_change("EXCLUDED", case_ids=[])


def test_batch_status_change_excludes_cases_with_note(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    case_controller.batch_status_change(
        "EXCLUDED", "I dislike this case", case_ids=["1", "2"]
    )
    an_excluded_case = case_controller.store.case_by_id("1")
    assert an_excluded_case.caseReference.status == "EXCLUDED"
    assert an_excluded_case.caseExclusion.note == "I dislike this case"
    another_case = case_controller.store.case_by_id("3")
    assert another_case.caseReference.status == "UNVERIFIED"
    assert another_case.caseExclusion is None


@freezegun.freeze_time("Aug 13th, 2021")
def test_batch_status_change_records_date_of_exclusion(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
            },
        }
    )

    case_controller.batch_status_change(
        "EXCLUDED", "Mistakes have been made", case_ids=["1"]
    )

    case = case_controller.store.case_by_id("1")
    assert case.caseReference.status == "EXCLUDED"
    assert case.caseExclusion.note == "Mistakes have been made"
    assert case.caseExclusion.date == date(2021, 8, 13)


def test_batch_status_change_removes_exclusion_data_on_unexcluding_case(
    case_controller,
):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
            },
        }
    )

    case_controller.batch_status_change(
        "EXCLUDED", "Mistakes have been made", case_ids=["1"]
    )
    case_controller.batch_status_change("UNVERIFIED", case_ids=["1"])

    case = case_controller.store.case_by_id("1")
    assert case.caseReference.status == "UNVERIFIED"
    assert case.caseExclusion is None


def test_batch_status_change_by_query(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
            },
        }
    )

    case_controller.batch_status_change(
        "EXCLUDED", "Mistakes have been made", filter="dateconfirmedafter:2021-06-01"
    )

    case = case_controller.store.case_by_id("1")
    assert case.caseReference.status == "EXCLUDED"
    assert case.caseExclusion is not None


def test_excluded_case_ids_raises_if_no_source_id(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.excluded_case_ids(source_id=None)


def test_excluded_case_ids_returns_empty_if_no_matching_cases(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
                "status": "VERIFIED",
            },
        }
    )
    ids = case_controller.excluded_case_ids("123ab4567890123ef4567890")
    assert len(ids) == 0


def test_excluded_case_ids_returns_ids_of_matching_cases(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
                "status": "EXCLUDED",
            },
            "caseExclusion": {
                "date": date(2022, 5, 17),
                "note": "I told him we already have one",
            },
        }
    )
    ids = case_controller.excluded_case_ids("123ab4567890123ef4567890")
    assert len(ids) == 1
    assert ids[0] == "1"


def test_updating_missing_case_should_throw_NotFoundError(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
                "status": "EXCLUDED",
            },
            "caseExclusion": {
                "date": date(2022, 5, 17),
                "note": "I told him we already have one",
            },
        }
    )
    with pytest.raises(NotFoundError):
        case_controller.update_case("2", {"caseExclusion": {"note": "Duplicate"}})


def test_updating_case_to_invalid_state_should_throw_ValidationError(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
                "status": "EXCLUDED",
            },
            "caseExclusion": {
                "date": date(2022, 5, 17),
                "note": "I told him we already have one",
            },
        }
    )
    with pytest.raises(ValidationError):
        case_controller.update_case("1", {"confirmationDate": None})


def test_updating_case_to_valid_state_returns_updated_case(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
                "status": "EXCLUDED",
            },
            "caseExclusion": {
                "date": date(2022, 5, 17),
                "note": "I told him we already have one",
            },
        }
    )

    new_case = case_controller.update_case("1", {"confirmationDate": date(2021, 6, 24)})
    assert new_case.confirmationDate == date(2021, 6, 24)


def test_batch_update_cases_returns_number_of_modified_cases(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    update_one = {
        "_id": "1",
        "caseReference": {"status": "EXCLUDED"},
        "caseExclusion": {"date": date(2022, 2, 2), "note": "Bad case no likey"},
    }
    update_two = {"_id": "2", "caseReference": {"status": "VERIFIED"}}
    num_modified = case_controller.batch_update([update_one, update_two])
    assert num_modified == 2
    case_one = case_controller.get_case("1")
    assert case_one.caseReference.status == "EXCLUDED"
    case_two = case_controller.get_case("2")
    assert case_two.caseReference.status == "VERIFIED"
    case_three = case_controller.get_case("3")
    assert case_three.caseReference.status == "UNVERIFIED"


def test_batch_update_raises_if_id_not_supplied(case_controller):
    update = {"confirmationDate": date(2022, 5, 3)}
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_update([update])


def test_batch_update_raises_if_case_would_be_invalid(case_controller):
    case_controller.create_case(
        {
            "confirmationDate": date(2021, 6, 23),
            "caseReference": {
                "sourceId": "123ab4567890123ef4567890",
                "status": "VERIFIED",
            },
        }
    )
    update = {"_id": "1", "confirmationDate": None}
    with pytest.raises(ValidationError):
        case_controller.batch_update([update])


def test_batch_update_raises_if_case_not_found(case_controller):
    update = {"_id": "1", "confirmationDate": date(2022, 5, 13)}
    with pytest.raises(NotFoundError):
        case_controller.batch_update([update])


def test_batch_update_query_returns_modified_count(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    update = {"confirmationDate": date(2022, 5, 13)}
    query = None  # didn't implement rich queries on the test store
    modified = case_controller.batch_update_query(query, update)
    assert modified == 4


def test_delete_present_case_deletes_case(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    case_controller.delete_case("1")
    assert case_controller.store.count_cases() == 3
    assert case_controller.store.case_by_id("1") is None


def test_delete_absent_case_raises_NotFoundError(case_controller):
    with pytest.raises(NotFoundError):
        case_controller.delete_case("1")


def test_cannot_batch_delete_both_query_and_case_ids(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete(query="", case_ids=[])


def test_cannot_batch_delete_neither_query_nor_case_ids(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete(None, None)


def test_cannot_batch_delete_everything(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete("", None)


def test_cannot_batch_delete_with_malformed_query(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete(" ", None)


def test_batch_delete_with_case_ids(case_controller):
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    case_controller.batch_delete(None, ["1", "2"])
    assert case_controller.store.count_cases() == 2


def test_batch_delete_with_query(case_controller):
    """This test is deliberately set up to effectively delete all cases because
    anything more nuanced would require interpreting filter logic in the test store,
    which is a lot of complexity for little value. Look to the end-to-end tests for
    better tests of the filtering logic, because the filters should definitely work in
    production data stores!"""
    for i in range(4):
        _ = case_controller.create_case(
            {
                "confirmationDate": date(2021, 6, i + 1),
                "caseReference": {"sourceId": "123ab4567890123ef4567890"},
            },
        )
    case_controller.batch_delete("dateconfirmedafter:2021-05-02", None)
    assert case_controller.store.count_cases() == 0
