import sys

from flask import jsonify
from datetime import date
from typing import List, Optional

from data_service.model.case import Case
from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.case_page import CasePage
from data_service.model.case_reference import CaseReference
from data_service.model.case_upsert_outcome import CaseUpsertOutcome
from data_service.model.document_update import DocumentUpdate
from data_service.model.filter import (
    Anything,
    Filter,
    AndFilter,
    PropertyFilter,
    FilterOperator,
)
from data_service.util.errors import (
    NotFoundError,
    PreconditionUnsatisfiedError,
    UnsupportedTypeError,
    ValidationError,
)


class CaseController:
    """Implements CRUD operations on cases. Uses an external store
    class to actually work with the cases collection, so that different
    storage technology can be chosen.
    All methods return a tuple of (response, HTTP status code)"""

    def __init__(self, store, outbreak_date: date):
        """store is an adapter to the external storage technology.
        outbreak_date is the earliest date on which this instance should accept cases."""
        self.store = store
        self.outbreak_date = outbreak_date

    def get_case(self, id: str):
        """Implements get /cases/:id. Interpretation of ID is dependent
        on the store implementation but here it is an opaque token that
        should be unique to each case."""
        case = self.store.case_by_id(id)
        if case is None:
            raise NotFoundError(f"No case with ID {id}")
        return case

    def list_cases(self, page: int = None, limit: int = None, filter: str = None):
        """Implements get /cases."""
        page = 1 if page is None else page
        limit = 10 if limit is None else limit
        if page <= 0:
            raise PreconditionUnsatisfiedError("page must be >0")
        if limit <= 0:
            raise PreconditionUnsatisfiedError("limit must be >0")
        predicate = CaseController.parse_filter(filter)
        if predicate is None:
            raise ValidationError("cannot understand query")
        cases = self.store.fetch_cases(page, limit, predicate)
        count = self.store.count_cases(predicate)
        nextPage = page + 1 if count > page * limit else None
        return CasePage(cases, count, nextPage)

    def create_case(self, maybe_case: dict, num_cases: int = 1):
        """Implements post /cases."""
        if num_cases <= 0:
            raise PreconditionUnsatisfiedError("Must create a positive number of cases")
        try:
            case = self.create_case_if_valid(maybe_case)
            for i in range(num_cases):
                self.store.insert_case(case)
            return
        except:
            # pass this upstream for the app to handle
            raise

    def validate_case_dictionary(self, maybe_case: dict):
        """Check whether a case _could_ be valid, without storing it if it is."""
        try:
            case = self.create_case_if_valid(maybe_case)
        except:
            # pass this upstream for the app to handle
            raise

    def batch_upsert(self, body: dict):
        """Upsert a collection of cases (updating ones that already exist, inserting
        new cases). This method can potentially return a 207 mixed status as each case is
        handled separately. The response will report the number of cases inserted, the
        number updated, and any validation errors encountered."""
        if body is None:
            raise UnsupportedTypeError("Empty request body is not supported")
        cases = body.get("cases")
        if cases is None or len(cases) == 0:
            raise PreconditionUnsatisfiedError("No cases to upsert!")
        errors = {}
        usable_cases = []
        for i, maybe_case in enumerate(cases):
            try:
                case = self.create_case_if_valid(maybe_case)
                usable_cases.append(case)
            except Exception as e:
                errors[str(i)] = e.args[0]
        (created, updated) = (
            self.store.batch_upsert(usable_cases) if len(usable_cases) > 0 else (0, 0)
        )
        return CaseUpsertOutcome(created, updated, errors)

    def download(
        self, format: str = "csv", filter: str = None, case_ids: List[str] = None
    ):
        """Download all cases matching the requested query, in the given format."""

        if filter is not None and case_ids is not None:
            raise PreconditionUnsatisfiedError(
                "Do not supply both a filter and a list of IDs"
            )

        permitted_formats = ["csv", "tsv", "json"]
        if format not in permitted_formats:
            raise UnsupportedTypeError(f"Format must be one of {permitted_formats}")
        # now we know the format is good, we can build method names using it
        converter_method = f"to_{format}"
        header_method = f"{format}_header"
        separator_method = f"{format}_separator"
        footer_method = f"{format}_footer"

        if case_ids is not None:
            case_iterator = self.store.identified_case_iterator(case_ids)
            count = len(case_ids)
        else:
            predicate = CaseController.parse_filter(filter)
            if predicate is None:
                raise ValidationError(f"cannot understand query {filter}")
            case_iterator = self.store.matching_case_iterator(predicate)
            count = self.store.count_cases(predicate)

        def generate_output():
            if hasattr(Case, header_method):
                yield getattr(Case, header_method)()
            i = 0
            has_separator = hasattr(Case, separator_method)
            for case in case_iterator:
                yield getattr(case, converter_method)()
                if i < count - 1:
                    if has_separator:
                        yield getattr(Case, separator_method)()
                    i += 1
            if hasattr(Case, footer_method):
                yield getattr(Case, footer_method)()

        return generate_output

    def batch_status_change(
        self,
        status: str,
        note: Optional[str] = None,
        case_ids: Optional[List[str]] = None,
        filter: Optional[str] = None,
    ):
        """Update all of the cases identified in case_ids to have the supplied curation status.
        Raises PreconditionUnsatisfiedError or ValidationError on invalid input."""
        statuses = CaseReference.valid_statuses()
        if not status in statuses:
            raise PreconditionUnsatisfiedError(f"status {status} not one of {statuses}")
        if filter is not None and case_ids is not None:
            raise PreconditionUnsatisfiedError(
                "Do not supply both a filter and a list of IDs"
            )
        if status == "EXCLUDED" and note is None:
            raise ValidationError(f"Excluding cases must be documented in a note")

        def update_status(id: str, status: str, note: str):
            if status == "EXCLUDED":
                caseExclusion = CaseExclusionMetadata()
                caseExclusion.note = note
            else:
                caseExclusion = None
            self.store.update_case_status(id, status, caseExclusion)

        if case_ids is not None:
            for anId in case_ids:
                update_status(anId, status, note)
        else:
            predicate = CaseController.parse_filter(filter)
            if predicate is None:
                raise ValidationError(f"cannot understand query {filter}")
            case_iterator = self.store.matching_case_iterator(predicate)
            for case in case_iterator:
                update_status(case._id, status, note)

    def excluded_case_ids(
        self, source_id: str, query: Optional[str] = None
    ) -> List[str]:
        """Return the identifiers of all excluded cases for a given source."""
        if source_id is None:
            raise PreconditionUnsatisfiedError("No sourceId provided")
        predicate = CaseController.parse_filter(query)
        if predicate is None:
            raise ValidationError(f"cannot understand query {predicate}")
        return [c._id for c in self.store.excluded_cases(source_id, predicate)]

    def update_case(self, case_id: str, update: dict) -> Case:
        """Update the case document with the provided ID. Raises NotFoundError if
        there is no case with that ID, or ValidationError if the case would not be
        left in a valid state. If the update is successfully applied, returns the updated
        form of the case."""
        diff = DocumentUpdate.from_dict(update)
        updated_case = self.validate_updated_case(case_id, diff)
        # tell the store to apply the update rather than replacing the whole document:
        # should be more efficient given a competent DB
        self.store.update_case(case_id, diff)
        return updated_case

    def batch_update(self, updates: List[dict]) -> int:
        """Update a collection of documents. Each dictionary in the list is a description
        of an update, but it also carries the _id field to indicate which case to update.
        Raises NotFoundError if any update identifies a case that isn't present, PreconditionUnsatisfiedError
        if any update doesn't include an id, or ValidationError if any update leaves a case
        in an inconsistent state."""

        def remove_id(d: dict):
            d2 = dict(d)
            del d2["_id"]
            return d2

        try:
            update_map = {
                u["_id"]: DocumentUpdate.from_dict(remove_id(u)) for u in updates
            }
        except KeyError:
            raise PreconditionUnsatisfiedError("not every update includes an _id")
        for id, update in iter(update_map.items()):
            self.validate_updated_case(id, update)
        return self.store.batch_update(update_map)

    def batch_update_query(self, query: str, update: dict) -> int:
        """Update a collection of documents. Update is a description
        of an update, and query indicates which cases to update.
        Raises ValidationError if any update leaves a case
        in an inconsistent state."""
        if update is None:
            raise PreconditionUnsatisfiedError("No update supplied")
        cases = self.list_cases(limit=sys.maxsize, filter=query)
        updates = []
        for case in cases.cases:
            an_update = dict(update)
            an_update["_id"] = case._id
            updates.append(an_update)
        return self.batch_update(updates)

    def delete_case(self, case_id: str):
        """Remove a case. Raises NotFoundError if no case with the given id exists."""
        if self.store.case_by_id(case_id) is None:
            raise NotFoundError(f"No case with ID {case_id}")
        self.store.delete_case(case_id)

    def batch_delete(
        self,
        query: Optional[str] = None,
        case_ids: Optional[list[str]] = None,
        threshold: Optional[int] = None,
    ):
        if not ((query is None) ^ (case_ids is None)):
            raise PreconditionUnsatisfiedError(
                "Must specify exactly one of query or case ID list"
            )
        if case_ids is not None:
            for case_id in case_ids:
                self.delete_case(case_id)
        else:  # query is not None
            filter = self.parse_filter(query)
            if filter is None or filter.matches_everything():
                raise PreconditionUnsatisfiedError(
                    f"unspported query in batch_delete: {query}"
                )
            target_case_count = self.store.count_cases(filter)
            if threshold and target_case_count > threshold:
                raise ValidationError(
                    f"Command would delete {target_case_count} cases, above threshold of {threshold}"
                )
            self.store.delete_cases(filter)

    def validate_updated_case(self, id: str, update: DocumentUpdate):
        """Find out whether updating a case would result in it being invalid.
        Raises NotFoundError if the case doesn't exist, or ValidationError if
        the update results in an invalid case. Returns the updated, valid case
        on success."""
        case = self.store.case_by_id(id)
        if case is None:
            raise NotFoundError(f"No case with ID {id}")
        # build the updated version of the case to validate
        updated_case = case.updated_document(update)
        updated_case.validate()
        self.check_case_preconditions(updated_case)
        return updated_case

    def create_case_if_valid(self, maybe_case: dict):
        """Attempts to create a case from an input dictionary and validate it against
        the application rules. Raises ValidationError or PreconditionUnsatisfiedError on invalid input."""
        case = Case.from_dict(maybe_case)
        self.check_case_preconditions(case)
        return case

    def check_case_preconditions(self, case: Case):
        if case.confirmationDate < self.outbreak_date:
            raise ValidationError("Confirmation date is before outbreak began")

    @staticmethod
    def parse_filter(filter: str) -> Filter:
        """Interpret the filter query in the incoming request."""
        if filter is None or len(filter) == 0:
            return Anything()
        try:
            # split query on spaces
            components = filter.split(" ")
            filters = [CaseController.individual_filter(c) for c in components]
            if None in filters:
                return None
            if len(filters) == 1:
                return filters[0]
            else:
                return AndFilter(filters)
        except ValueError:
            raise PreconditionUnsatisfiedError(f"Malformed query {filter}")

    @staticmethod
    def individual_filter(term: str) -> Filter:
        """Turn a single property:value filter request into a filter object"""
        # keyword value pairs separated by colon
        (keyword, value) = term.split(":")
        if len(keyword) == 0 or len(value) == 0:
            return None
        # special case dateconfirmedbefore, dateconfirmedafter
        if keyword == "dateconfirmedbefore":
            return PropertyFilter(
                "confirmationDate", FilterOperator.LESS_THAN, date.fromisoformat(value)
            )
        if keyword == "dateconfirmedafter":
            return PropertyFilter(
                "confirmationDate",
                FilterOperator.GREATER_THAN,
                date.fromisoformat(value),
            )
        # anything else (not supported yet) is equality
