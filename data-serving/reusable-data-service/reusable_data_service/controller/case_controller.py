from flask import jsonify


class CaseController:
    """Implements CRUD operations on cases. Uses an external store
    class to actually work with the cases collection, so that different
    storage technology can be chosen.
    All methods return a tuple of (response, HTTP status code)"""

    def __init__(self, store):
        self.store = store

    def get_case(self, id: str):
        """Implements get /cases/:id. Interpretation of ID is dependent
        on the store implementation but here it is an opaque token that
        should be unique to each case."""
        case = self.store.case_by_id(id)
        if case is None:
            return f"No case with ID {id}", 404
        return jsonify(case), 200

    def list_cases(self, page:int=1, limit:int=10):
        """Implements get /cases."""
        validation_error = None
        if page <= 0:
            validation_error = { "message" : "page must be >0" }
        if limit <= 0:
            validation_error = { "message" : "limit must be >0" }
        if validation_error is not None:
            return jsonify(validation_error), 422
        cases = self.store.fetch_cases(page, limit)
        count = self.store.count_cases()
        response = {
            "cases": cases,
            "total": count
        }
        if count > page * limit:
            response["nextPage"] = page + 1

        return jsonify(response), 200
