import pytest
import bson
from datetime import date
from reusable_data_service import Case, CaseReference


def test_instantiating_case_from_empty_json_is_error():
    with pytest.raises(ValueError):
        case = Case.from_json("{}")


def test_case_from_minimal_json_is_valid():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        assert case is not None


def test_csv_header():
    header_line = Case.csv_header()
    assert header_line == "_id,confirmationDate,caseReference.sourceId"


def test_csv_row_with_no_id():
    identifier = "abcd12903478565647382910"
    oid = bson.ObjectId(identifier)
    ref = CaseReference()
    ref.sourceId = oid
    case = Case()
    case.confirmationDate = date(2022, 6, 13)
    case.caseReference = ref
    csv = case.to_csv()
    assert csv == ",2022-06-13,abcd12903478565647382910"


def test_csv_row_with_id():
    id1 = "abcd01903478565647382910"
    id2 = "abcd12903478565647382910"
    oid2 = bson.ObjectId(id2)
    ref = CaseReference()
    ref.sourceId = oid2
    case = Case()
    case._id = id1
    case.confirmationDate = date(2022, 6, 13)
    case.caseReference = ref
    csv = case.to_csv()
    assert csv == f"{id1},2022-06-13,{id2}"
