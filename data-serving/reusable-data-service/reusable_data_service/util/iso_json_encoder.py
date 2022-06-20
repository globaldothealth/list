import flask.json
import datetime


class ISOJSONEncoder(flask.json.JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj, datetime.date):
                return obj.isoformat()
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return flask.json.JSONEncoder.default(self, obj)
