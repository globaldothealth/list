import flask.json
import bson
import datetime


class JSONEncoder(flask.json.JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj, datetime.date):
                return obj.isoformat()
            elif isinstance(obj, bson.ObjectId):
                return str(obj)
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return flask.json.JSONEncoder.default(self, obj)
