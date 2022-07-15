import pytest

from datetime import date

from data_service.model.case import Case
from data_service.model.case_reference import CaseReference
from data_service.model.filter import AndFilter, Anything, PropertyFilter, FilterOperator
from data_service.stores.memory_store import MemoryStore


@pytest.fixture
def memory_store_with_cases():
    store = MemoryStore()
    for i in range(1, 10):
        case = Case()
        case_reference = CaseReference()
        case_reference.source_id = "09876543210987654321abcd"
        case_reference.status = "UNVERIFIED"
        case.caseReference = case_reference
        case.confirmationDate = date(2021,4,i)
        store.insert_case(case)
    yield store


def test_memory_store_count_anything_filter(memory_store_with_cases):
    count = memory_store_with_cases.count_cases(Anything())
    assert count == 9


def test_memory_store_count_property_filter(memory_store_with_cases):
    filter = PropertyFilter('confirmationDate', FilterOperator.LESS_THAN, date(2021, 4, 4))
    count = memory_store_with_cases.count_cases(filter)
    assert count == 3


def test_memory_store_count_and_filter(memory_store_with_cases):
    f1 = PropertyFilter('confirmationDate', FilterOperator.LESS_THAN, date(2021, 4, 4))
    f2 = PropertyFilter('caseReference.status', FilterOperator.EQUAL, 'EXCLUDED')
    and_filter = AndFilter([f1, f2])
    count = memory_store_with_cases.count_cases(and_filter)
    assert count == 0
