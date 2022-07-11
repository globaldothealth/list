class DocumentUpdate:
    """Represents a collection of changes to a document."""

    def __init__(self):
        self.updates = dict()

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
        for k, v in iter(dict.items()):
            update.update(k, v)
        return update

    def update(self, key, value):
        """Record that the value at key should be changed to the supplied value."""
        self.updates[key] = value

    def updates_iter(self):
        return iter(self.updates.items())
