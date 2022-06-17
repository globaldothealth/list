import pytest
from reusable_data_service import Case

def test_instantiating_case_from_empty_json_is_error():
    with pytest.raises(ValueError):
        case = Case.from_json('{}')
