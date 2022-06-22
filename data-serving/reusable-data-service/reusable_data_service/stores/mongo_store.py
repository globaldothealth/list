import datetime
import os
import pymongo
from reusable_data_service.model.case import Case
from reusable_data_service.model.filter import Filter, Anything, PropertyFilter, FilterOperator
from json import loads
from bson.errors import InvalidId
from bson.json_util import dumps
from bson.objectid import ObjectId


class MongoStore:
    """A line list store backed by mongodb."""

    def __init__(
        self, connection_string: str, database_name: str, collection_name: str
    ):
        self.client = pymongo.MongoClient(connection_string)
        self.database_name = database_name
        self.collection_name = collection_name

    def get_client(self):
        return self.client

    def get_database(self):
        return self.get_client()[self.database_name]

    def get_case_collection(self):
        return self.get_database()[self.collection_name]

    def case_by_id(self, id: str):
        try:
            case = self.get_case_collection().find_one({"_id": ObjectId(id)})
            if case is not None:
                # case includes BSON fields like ObjectID - convert into JSON for use by the app
                return Case.from_json(dumps(case))
            else:
                return None
        except InvalidId:
            return None

    def fetch_cases(self, page: int, limit: int, filter: Filter):
        cases = self.get_case_collection().find(
            filter.to_mongo_query(), skip=(page - 1) * limit, limit=limit
        )
        return [Case.from_json(dumps(c)) for c in cases]

    def count_cases(self, filter: Filter) -> int:
        if isinstance(filter, Anything):
            return self.get_case_collection().estimated_document_count()
        return self.get_case_collection().count_documents(filter.to_mongo_query())

    @staticmethod
    def setup():
        """Configure a store instance from the environment."""
        mongo_connection_string = os.environ.get("MONGO_CONNECTION")
        mongo_database = os.environ.get("MONGO_DB")
        mongo_collection = os.environ.get("MONGO_CASE_COLLECTION")
        mongo_store = MongoStore(
            mongo_connection_string, mongo_database, mongo_collection
        )
        return mongo_store


# Add methods to the Filter classes here to turn them into Mongo queries.
def anything_query(self):
    return {}

Anything.to_mongo_query = anything_query

def property_query(self):
    # rewrite dates specified in the app to datetimes because pymongo
    # expects datetimes to represent BSON dates.
    value = datetime.datetime(self.value.year, self.value.month, self.value.day) if isinstance(self.value, datetime.date) else self.value
    match self.operation:
        case FilterOperator.LESS_THAN:
            return { self.property_name: { "$lt" : value }}
        case FilterOperator.GREATER_THAN:
            return { self.property_name: { "$gt" : value }}
        case _:
            raise ValueError(f"Unhandled operation {self.operation}")

PropertyFilter.to_mongo_query = property_query
