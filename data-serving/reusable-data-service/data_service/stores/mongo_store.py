import datetime
import os
import pymongo
from data_service.model.case import Case
from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.document_update import DocumentUpdate
from data_service.model.filter import (
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

    def replace_case(self, id: str, case: Case):
        to_replace = MongoStore.case_to_bson_compatible_dict(case)
        oid = ObjectId(id)
        result = self.get_case_collection().replace_one({"_id": oid}, to_replace)
        if result.modified_count != 1:
            raise ValueError("Did not update any documents!")

    def update_case_status(
        self, id: str, status: str, exclusion: CaseExclusionMetadata
    ):
        update = {"$set": {"caseReference.status": status}}
        if exclusion:
            update["$set"][
                "caseExclusion"
            ] = self.case_exclusion_to_bson_compatible_dict(exclusion)
        else:
            update["$unset"] = {"caseExclusion": True}
        self.get_case_collection().update_one({"_id": ObjectId(id)}, update)

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

    def excluded_cases(self, source_id: str, filter: Filter) -> List[Case]:
        """Return all cases for a given source that are excluded."""
        query = filter.to_mongo_query()
        cases = self.get_case_collection().find(
            {
                "$and": [
                    {
                        "caseReference.sourceId": ObjectId(source_id),
                        "caseReference.status": "EXCLUDED",
                    },
                    query,
                ]
            }
        )
        return [Case.from_json(dumps(c)) for c in cases]

    def update_case(self, id: str, update: DocumentUpdate):
        if len(update) == 0:
            return  # nothing to do
        command = self.mongodb_update_command(update)
        self.get_case_collection().update_one({"_id": ObjectId(id)}, command)

    def batch_update(self, updates: dict[str, DocumentUpdate]):
        mongo_commands = {
            ObjectId(k): self.mongodb_update_command(v)
            for k, v in iter(updates.items())
        }
        update_ones = [
            pymongo.UpdateOne({"_id": k}, v) for k, v in iter(mongo_commands.items())
        ]
        result = self.get_case_collection().bulk_write(update_ones)
        return result.modified_count

    def delete_case(self, id: str):
        """Delete the case with the specified ID"""
        self.get_case_collection().delete_one({"_id": ObjectId(id)})

    def delete_cases(self, filter: Filter):
        """Delete all cases that match the specified filter."""
        predicate = filter.to_mongo_query()
        self.get_case_collection().delete_many(predicate)

    @staticmethod
    def mongodb_update_command(update: DocumentUpdate):
        objectify_id = (
            lambda k, v: ObjectId(v)
            if Case.field_type_for_key_path(k) == ObjectId
            else v
        )
        sets = {key: objectify_id(key, value) for key, value in update.updates_iter()}
        unsets = {key: True for key in update.unsets_iter()}
        command = dict()
        if len(sets) > 0:
            command["$set"] = sets
        if len(unsets) > 0:
            command["$unset"] = unsets
        return command

    def matching_case_iterator(self, predicate: Filter):
        """Return an object that iterates over cases matching the predicate."""
        cases = self.get_case_collection().find(predicate.to_mongo_query())
        return MongoStore.case_model_iterator(cases)

    def identified_case_iterator(self, caseIds: List[str]):
        """Return an object that iterates over cases with the listed IDs."""
        oids = [ObjectId(anId) for anId in caseIds]
        cases = self.get_case_collection().find({"_id": {"$in": oids}})
        return MongoStore.case_model_iterator(cases)

    @staticmethod
    def case_model_iterator(mongo_iterator):
        """Turn an iterator of mongo results into an iterator of cases."""
        return map(lambda c: Case.from_json(dumps(c)), mongo_iterator)

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
        # will complain that you're trying to rewrite the _id (to the same
        # value it already had, although because it treats the string value as
        # different from the ObjectId value)! Therefore remove it always here. If you find
        # a case where mongo wants the _id in a document, add it back for that
        # operation.
        del bson_case["_id"]
        # BSON works with datetimes, not dates
        for field in Case.date_fields():
            bson_case[field] = date_to_datetime(bson_case[field])
        if case.caseExclusion is not None:
            bson_case[
                "caseExclusion"
            ] = MongoStore.case_exclusion_to_bson_compatible_dict(case.caseExclusion)
        return bson_case

    @staticmethod
    def case_exclusion_to_bson_compatible_dict(exclusion: CaseExclusionMetadata):
        """Turn a case exclusion document into a representation that mongo will accept."""
        bson_exclusion = exclusion.to_dict()
        for field in CaseExclusionMetadata.date_fields():
            bson_exclusion[field] = date_to_datetime(bson_exclusion[field])
        return bson_exclusion


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
