from flask import jsonify
from datetime import date
from reusable_data_service.model.case import Case
from reusable_data_service.model.filter import (
    Anything,
    Filter,
    AndFilter,
    PropertyFilter,
    FilterOperator,
)


class PreconditionError(Exception):
    pass


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
            return f"No case with ID {id}", 404
        return jsonify(case), 200

    def list_cases(self, page: int = None, limit: int = None, filter: str = None):
        """Implements get /cases."""
        page = 1 if page is None else page
        limit = 10 if limit is None else limit
        validation_error = None
        if page <= 0:
            validation_error = {"message": "page must be >0"}
        if limit <= 0:
            validation_error = {"message": "limit must be >0"}
        if validation_error is not None:
            return jsonify(validation_error), 400
        predicate = CaseController.parse_filter(filter)
        if predicate is None:
            validation_error = {"message:" "cannot understand query"}
            return jsonify(validation_error), 422
        cases = self.store.fetch_cases(page, limit, predicate)
        count = self.store.count_cases(predicate)
        response = {"cases": cases, "total": count}
        if count > page * limit:
            response["nextPage"] = page + 1

        return jsonify(response), 200

    def create_case(self, maybe_case: dict, num_cases: int = 1):
        """Implements post /cases."""
        if num_cases <= 0:
            return "Must create a positive number of cases", 400
        try:
            case = self.create_case_if_valid(maybe_case)
            for i in range(num_cases):
                self.store.insert_case(case)
            return "", 201
        except ValueError as ve:
            # ValueError means we can't even turn this into a case
            return ve.args[0], 400
        except PreconditionError as pe:
            # PreconditionError means it's a case, but not one we can use
            return pe.args[0], 422

    def validate_case_dictionary(self, maybe_case: dict):
        """Check whether a case _could_ be valid, without storing it if it is."""
        try:
            case = self.create_case_if_valid(maybe_case)
            return "", 204
        except ValueError as ve:
            # ValueError means we can't even turn this into a case
            return ve.args[0], 400
        except PreconditionError as pe:
            # PreconditionError means it's a case, but not one we can use
            return pe.args[0], 422

    def create_case_if_valid(self, maybe_case: dict):
        """Attempts to create a case from an input dictionary and validate it against
        the application rules. Raises ValueError or PreconditionError on invalid input."""
        case = Case.from_dict(maybe_case)
        self.check_case_preconditions(case)
        return case

    def check_case_preconditions(self, case: Case):
        if case.confirmationDate < self.outbreak_date:
            raise PreconditionError("Confirmation date is before outbreak began")

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
