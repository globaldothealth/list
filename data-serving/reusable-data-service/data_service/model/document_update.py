import collections


class DocumentUpdate:
    """Represents a collection of changes to a document."""

    def __init__(self):
        self.updates = dict()
        self.unsets = set()

    @staticmethod
    def from_dict(dict):
        """A dictionary representation of an update looks like this:
        {
            "foo": 123, # update foo to 123
            "bar": None, # unset bar
            "sub_document": {
                "baz": False, # set sub_document.baz to False
            }
        }
        """
        update = DocumentUpdate()
        DocumentUpdate._internal_from_dict(update, dict, "")
        return update

    @staticmethod
    def _internal_from_dict(update, dict, prefix):
        for k, v in iter(dict.items()):
            if isinstance(v, collections.abc.Mapping):
                DocumentUpdate._internal_from_dict(update, v, prefix + k + ".")
            else:
                update.update(prefix + k, v)

    def update(self, key, value):
        """Record that the value at key should be changed to the supplied value."""
        if value is None:
            self.unsets.add(key)
        else:
            self.updates[key] = value

    def updates_iter(self):
        return iter(self.updates.items())

    def unsets_iter(self):
        return iter(self.unsets)

    def __len__(self):
        return len(self.updates) + len(self.unsets)
