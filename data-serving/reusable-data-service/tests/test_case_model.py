import pytest
from reusable_data_service import Case


def test_instantiating_case_from_empty_json_is_error():
    with pytest.raises(ValueError):
        case = Case.from_json("{}")


def test_case_from_minimal_json_is_valid():
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        assert case is not None
