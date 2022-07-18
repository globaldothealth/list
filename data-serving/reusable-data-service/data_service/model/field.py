import dataclasses
from datetime import date

from data_service.model.document import Document


@dataclasses.dataclass
class Field(Document):
    """Represents a custom field in a Document object."""

    key: str = dataclasses.field(init=True, default=None)
    type: type = dataclasses.field(init=True, default=None)
    data_dictionary_text: str = dataclasses.field(init=True, default=None)
    STRING = str
    DATE = date
    acceptable_types = [STRING, DATE]
