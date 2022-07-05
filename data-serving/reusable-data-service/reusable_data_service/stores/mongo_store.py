import datetime
import os
import pymongo
from reusable_data_service.model.case import Case
from reusable_data_service.model.filter import (
    Filter,
    Anything,
    AndFilter,
    PropertyFilter,
    FilterOperator,
)
from json import loads
from bson.errors import InvalidId
from bson.json_util import dumps
from bson.objectid import ObjectId
from typing import List, Tuple


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

    def insert_case(self, case: Case):
        to_insert = MongoStore.case_to_bson_compatible_dict(case)
        self.get_case_collection().insert_one(to_insert)

    def batch_upsert(self, cases: List[Case]) -> Tuple[int, int]:
        to_insert = [
            MongoStore.case_to_bson_compatible_dict(c) for c in cases if c._id is None
        ]
        to_replace = {
            c._id: MongoStore.case_to_bson_compatible_dict(c)
            for c in cases
            if c._id is not None
        }
        inserts = [pymongo.InsertOne(d) for d in to_insert]
        replacements = [
            pymongo.ReplaceOne({"_id": k}, v) for (k, v) in to_replace.items()
        ]
        results = self.get_case_collection().bulk_write(inserts + replacements)
        return results.inserted_count, results.modified_count

    def matching_case_iterator(self, predicate: Filter):
        """Return an object that iterates over cases matching the predicate."""
        cases = self.get_case_collection().find(
            predicate.to_mongo_query()
        )
        return map(lambda c: Case.from_json(dumps(c)), cases)

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

    @staticmethod
    def case_to_bson_compatible_dict(case: Case):
        """Turn a case into a representation that mongo will accept."""
        bson_case = case.to_dict()
        # Mongo mostly won't like having the _id left around: for inserts
        # it will try to use the (None) _id and fail, and for updates it
        # will complain that you're trying to rewrite the _id (to the same)
        # value it already had! Therefore remove it always here. If you find
        # a case where mongo wants the _id in a document, add it back for that
        # operation.
        del bson_case["_id"]
        for field in Case.date_fields():
            # BSON works with datetimes, not dates
            bson_case[field] = date_to_datetime(bson_case[field])
        return bson_case


def date_to_datetime(dt: datetime.date) -> datetime.datetime:
    """Convert datetime.date to datetime.datetime for encoding as BSON"""
    return datetime.datetime(dt.year, dt.month, dt.day)


# Add methods to the Filter classes here to turn them into Mongo queries.
def anything_query(self):
    return {}


Anything.to_mongo_query = anything_query


def property_query(self):
    # rewrite dates specified in the app to datetimes because pymongo
    # expects datetimes to represent BSON dates.
    value = (
        date_to_datetime(self.value)
        if isinstance(self.value, datetime.date)
        else self.value
    )
    match self.operation:
        case FilterOperator.LESS_THAN:
            return {self.property_name: {"$lt": value}}
        case FilterOperator.GREATER_THAN:
            return {self.property_name: {"$gt": value}}
        case _:
            raise ValueError(f"Unhandled operation {self.operation}")


PropertyFilter.to_mongo_query = property_query


def and_query(self):
    return {"$and": [f.to_mongo_query() for f in self.filters]}


AndFilter.to_mongo_query = and_query
