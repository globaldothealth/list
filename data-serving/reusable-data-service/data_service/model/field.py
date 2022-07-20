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
    default: Optional[Union[bool, str, int, date]] = dataclasses.field(init=True, default=None)
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
