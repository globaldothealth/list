import dataclasses
from datetime import date
from typing import Optional, Union

from data_service.model.document import Document
from data_service.util.errors import PreconditionUnsatisfiedError


@dataclasses.dataclass
class Field(Document):
    """Represents a custom field in a Document object."""

    key: str = dataclasses.field(init=True, default=None)
    type: str = dataclasses.field(init=True, default=None)
    data_dictionary_text: str = dataclasses.field(init=True, default=None)
    required: bool = dataclasses.field(init=True, default=False)
    default: Optional[Union[bool, str, int, date]] = dataclasses.field(
        init=True, default=None
    )
    STRING = "string"
    DATE = "date"
    INTEGER = "integer"
    type_map = {STRING: str, DATE: date, INTEGER: int}
    acceptable_types = type_map.keys()

    @classmethod
    def model_type(cls, name: str) -> type:
        try:
            return cls.type_map[name]
        except KeyError:
            raise PreconditionUnsatisfiedError(f"cannot use type {name} in a Field")

    def python_type(self) -> type:
        return self.model_type(self.type)

    def dataclasses_tuple(self) -> (str, type, dataclasses.Field):
        # Note that the default value here is always None, even if I have a default value!
        # That's because the meaning of "required" in a field model is "a user _is required_ to
        # supply a value" and the meaning of "default" is "for cases that don't already have this
        # key, use the default value"; if I give every Case the default value then there's no sense
        # in which a user is required to define it themselves.
        return (
            self.key,
            self.python_type(),
            dataclasses.field(init=False, default=None),
        )