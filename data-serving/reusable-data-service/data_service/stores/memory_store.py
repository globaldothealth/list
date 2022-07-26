from functools import reduce
from operator import attrgetter, and_
from typing import List, Optional

from data_service.model.case import Case
from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.document_update import DocumentUpdate
from data_service.model.field import Field
from data_service.model.filter import (
    Filter,
    Anything,
    PropertyFilter,
    AndFilter,
    FilterOperator,
)


class MemoryStore:
    """Simple dictionary-based store for cases."""

    def __init__(self):
        self.cases = dict()
        self.fields = []
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
        case.caseStatus = status
        case.caseExclusion = exclusion

    def fetch_cases(self, page: int, limit: int, predicate: Filter):
        return list(self.cases.values())[(page - 1) * limit : page * limit]

    def count_cases(self, predicate: Filter = Anything()):
        return len([True for c in self.cases.values() if predicate(c)])

    def batch_upsert(self, cases: List[Case]):
        for case in cases:
            self.insert_case(case)
        return len(cases), 0

    def excluded_cases(self, source_id: str, filter: Filter):
        return [
            c
            for c in self.cases.values()
            if c.caseReference.sourceId == source_id
            and c.caseStatus == "omit_error"
        ]

    def delete_case(self, case_id: str):
        del self.cases[case_id]

    def delete_cases(self, query: Filter):
        self.cases = dict()

    def matching_case_iterator(self, query: Filter):
        return iter(self.cases.values())

    def identified_case_iterator(self, case_ids):
        ids_as_ints = [int(x) for x in case_ids]
        all_cases = list(self.cases.values())
        matching_cases = [all_cases[i] for i in ids_as_ints]
        return iter(matching_cases)

    def add_field(self, field: Field):
        self.fields.append(field)

    def get_case_fields(self) -> List[Field]:
        return self.fields


def anything_call(self, case: Case):
    return True


Anything.__call__ = anything_call


def property_call(self, case: Case):
    my_value = self.value
    its_value = attrgetter(self.property_name)(case)
    match self.operation:
        case FilterOperator.LESS_THAN:
            return its_value < my_value
        case FilterOperator.GREATER_THAN:
            return its_value > my_value
        case FilterOperator.EQUAL:
            return its_value == my_value
        case _:
            raise ValueError(f"Unhandled operation {self.operation}")


PropertyFilter.__call__ = property_call


def and_call(self, case: Case):
    return reduce(and_, [f(case) for f in self.filters])


AndFilter.__call__ = and_call
