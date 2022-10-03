import dataclasses
from datetime import date
from typing import Any, List, Optional, Union

from data_service.model.age_range import AgeRange
from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.case_reference import CaseReference
from data_service.model.document import Document
from data_service.model.geojson import Feature
from data_service.util.errors import PreconditionUnsatisfiedError


@dataclasses.dataclass
class Field(Document):
    """Represents a custom field in a Document object.
    Note for future architects: I learned today that dataclasses fields can carry
    custom metadata. It might make sense to reorganise things so that information
    currently in the Field class is carried in that metadata instead."""

    key: str = dataclasses.field(init=True, default=None)
    type: str = dataclasses.field(init=True, default=None)
    data_dictionary_text: str = dataclasses.field(init=True, default=None)
    required: bool = dataclasses.field(init=True, default=False)
    default: Optional[Union[bool, str, int, date, Feature, AgeRange, CaseReference, CaseExclusionMetadata]] = dataclasses.field(
        init=True, default=None
    )
    values: Optional[List[Any]] = dataclasses.field(init=True, default=None)
    is_list: bool = dataclasses.field(init=True, default=False)

    STRING = "string"
    DATE = "date"
    INTEGER = "integer"
    LOCATION = "geofeature"
    AGE_RANGE = "age_range"
    type_map = {
        STRING: str,
        DATE: date,
        INTEGER: int,
        LOCATION: Feature,
        AGE_RANGE: AgeRange,
        "CaseReference": CaseReference,
        "CaseExclusion": CaseExclusionMetadata,
    }
    acceptable_types = type_map.keys()

    @classmethod
    def model_type(cls, name: str) -> type:
        try:
            return cls.type_map[name]
        except KeyError:
            raise PreconditionUnsatisfiedError(f"cannot use type {name} in a Field")

    @classmethod
    def from_dict(cls, dictionary):
        return cls(
            dictionary.get("key"),
            dictionary.get("type"),
            dictionary.get("data_dictionary_text"),
            dictionary.get("required"),
            dictionary.get("default", None),
            dictionary.get("values", None),
            dictionary.get("is_list", False),
        )

    def python_type(self) -> type:
        if self.is_list:
            return list
        else:
            return self.element_type()
    
    def element_type(self) -> type:
        return self.model_type(self.type)

    def dataclasses_tuples(self):
        # Note that the default value here is always None, even if I have a default value!
        # That's because the meaning of "required" in a field model is "a user _is required_ to
        # supply a value" and the meaning of "default" is "for cases that don't already have this
        # key, use the default value"; if I give every Case the default value then there's no sense
        # in which a user is required to define it themselves.
        fields = [
            (
                self.key,
                self.python_type(),
                dataclasses.field(init=False, default=None),
            )
        ]
        if self.values is not None and "other" in self.values:
            fields.append(
                (f"{self.key}_other", str, dataclasses.field(init=False, default=None))
            )
        return fields
