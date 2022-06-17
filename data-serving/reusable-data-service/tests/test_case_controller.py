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


@pytest.fixture
def app_context():
    with app.app_context():
        yield


def test_one_present_item_should_return_200_OK(app_context):
    store = MemoryStore()
    with open('./tests/data/case.minimal.json', 'r') as minimal_file:
        case = Case.from_json(minimal_file.read())
        store.put_case('foo', case)
    controller = CaseController(store)
    (response, status) = controller.get_case('foo')
    assert status == 200
    assert response is not None

def test_one_absent_item_should_return_400_not_found(app_context):
    store = MemoryStore()
    controller = CaseController(store)
    (response, status) = controller.get_case('foo')
    assert status == 404
    assert response == "No case with ID foo"
