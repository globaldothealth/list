from flask import jsonify
from datetime import date
from typing import List

from reusable_data_service.model.case import Case
from reusable_data_service.model.case_page import CasePage
from reusable_data_service.model.case_upsert_outcome import CaseUpsertOutcome
from reusable_data_service.model.filter import (
    Anything,
    Filter,
    AndFilter,
    PropertyFilter,
    FilterOperator,
)
from reusable_data_service.util.errors import (
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

    def __init__(self, app, store, outbreak_date: date):
        """store is the flask app
        store is an adapter to the external storage technology.
        outbreak_date is the earliest date on which this instance should accept cases."""
        self.app = app
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
        if filter is None:
            return Anything()
        # split query on spaces
        components = filter.split(" ")
        filters = [CaseController.individual_filter(c) for c in components]
        if None in filters:
            return None
        if len(filters) == 1:
            return filters[0]
        else:
            return AndFilter(filters)

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
