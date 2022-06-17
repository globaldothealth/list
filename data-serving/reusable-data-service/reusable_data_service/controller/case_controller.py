from flask import jsonify

class CaseController:
    """Implements CRUD operations on cases. Uses an external store
    class to actually work with the cases collection, so that different
    storage technology can be chosen.
    All methods return a tuple of (response, HTTP status code)"""
    def __init__(self, store):
        self._store = store

    def get_case(self, id: str):
        """Implements get /cases/:id. Interpretation of ID is dependent
        on the store implementation but here it is an opaque token that
        should be unique to each case."""
        case = self._store.case_by_id(id)
        if case is None:
            return f"No case with ID {id}", 404
        return jsonify(case), 200
