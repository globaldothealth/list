import os
import pymongo
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
            # case includes BSON fields like ObjectID - convert into JSON for use by the app
            return loads(dumps(case))
        except InvalidId:
            return None

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
