import pytest
import bson
from datetime import date
from data_service.model.case import Case
from data_service.model.case_reference import CaseReference
from data_service.model.document_update import DocumentUpdate
from data_service.model.geojson import Feature, Point
from data_service.util.errors import ValidationError


def test_instantiating_case_from_empty_json_is_error():
    with pytest.raises(ValidationError):
        case = Case.from_json("{}")


def test_case_from_minimal_json_is_valid():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        assert case is not None


def test_case_with_geojson_is_valid():
    with open("./tests/data/case.with_location.json", "r") as file:
        case = Case.from_json(file.read())
        assert case is not None
        assert case.location is not None
        assert type(case.location) == Feature


def test_csv_header():
    header_line = Case.csv_header()
    header_fields = header_line.split(",")
    assert "caseStatus" in header_fields
    assert "location.latitude" in header_fields


def test_csv_row_with_no_id():
    identifier = "abcd12903478565647382910"
    oid = bson.ObjectId(identifier)
    ref = CaseReference()
    ref.sourceId = oid
    case = Case()
    case.confirmationDate = date(2022, 6, 13)
    case.caseReference = ref
    case.caseStatus = "probable"
    case.pathogenStatus = "emerging"
    csv = case.to_csv()
    csv_fields = csv.split(",")
    assert "probable" in csv_fields
    assert "2022-06-13" in csv_fields


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
    case.caseStatus = "probable"
    case.pathogenStatus = "unknown"
    csv = case.to_csv()
    csv = case.to_csv()
    csv_fields = csv.split(",")
    assert "probable" in csv_fields
    assert "2022-06-13" in csv_fields


def test_apply_update_to_case():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    update = DocumentUpdate.from_dict({"confirmationDate": date(2022, 3, 7)})
    updated_case = case.updated_document(update)
    # original case should be unchanged
    assert case.confirmationDate == date(2021, 12, 31)
    # new case should be updated
    assert updated_case.confirmationDate == date(2022, 3, 7)


def test_apply_update_that_unsets_value():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    update = DocumentUpdate.from_dict({"confirmationDate": None})
    case.apply_update(update)
    assert case.confirmationDate is None


def test_cannot_put_wrong_type_in_list():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    case.gender = ["man", True]
    with pytest.raises(ValidationError):
        case.validate()


def test_list_elements_must_come_from_acceptable_values():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
    case.gender = ["woman", "dalek"]
    with pytest.raises(ValidationError):
        case.validate()
