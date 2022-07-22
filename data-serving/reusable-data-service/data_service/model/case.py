import dataclasses
import datetime
import json
import flask.json

from collections.abc import Callable
from operator import attrgetter
from typing import Any, List

from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.case_reference import CaseReference
from data_service.model.document import Document
from data_service.model.field import Field
from data_service.model.geojson import Feature
from data_service.util.errors import (
    ConflictError,
    DependencyFailedError,
    PreconditionUnsatisfiedError,
    ValidationError,
)


@dataclasses.dataclass()
class DayZeroCase(Document):
    """This class implements the "day-zero" data schema for Global.health.
    At the beginning of an outbreak, we want to collect at least this much
    information about an individual case for the line list.

    Parameters here are defined to be keyword-only and not set in the
    initialiser, so that clients can use Builder to populate them. Use
    the validate() method to determine whether an instance is in a
    consistent state (this also means we can add custom validation logic
    to that function)."""

    _: dataclasses.KW_ONLY
    """_id is treated as an opaque identifier by the model, allowing the
    store to use whatever format it needs to uniquely identify a stored case.
    The _id is allowed to be None, for cases that have been created but not
    yet saved into a store."""
    _id: str = dataclasses.field(init=False, default=None)
    confirmationDate: datetime.date = dataclasses.field(init=False)
    caseReference: CaseReference = dataclasses.field(init=False, default=None)
    caseExclusion: CaseExclusionMetadata = dataclasses.field(init=False, default=None)
    location: Feature = dataclasses.field(init=False, default=None)

    custom_fields = []

    @classmethod
    def from_json(cls, obj: str) -> type:
        """Create an instance of this class from a JSON representation."""
        source = json.loads(obj)
        return cls.from_dict(source)

    @classmethod
    def from_dict(cls, dictionary: dict[str, Any]) -> type:
        case = cls()
        for key in dictionary:
            if key in cls.date_fields():
                value = cls.interpret_date(dictionary[key])
            elif key in cls.location_fields():
                value = Feature.from_dict(dictionary[key])
            elif key == "caseReference":
                caseRef = dictionary[key]
                value = (
                    CaseReference.from_dict(caseRef) if caseRef is not None else None
                )
            elif key == "caseExclusion":
                exclusion = dictionary[key]
                value = (
                    CaseExclusionMetadata.from_dict(exclusion)
                    if exclusion is not None
                    else None
                )
            elif key == "_id":
                the_id = dictionary[key]
                if isinstance(the_id, dict):
                    # this came from a BSON objectID representation
                    value = the_id["$oid"]
                else:
                    value = the_id
            else:
                value = dictionary[key]
            setattr(case, key, value)
        case.validate()
        return case

    def validate(self):
        """Check whether I am consistent. Raise ValidationError if not."""
        if not hasattr(self, "confirmationDate"):
            raise ValidationError("Confirmation Date is mandatory")
        elif self.confirmationDate is None:
            raise ValidationError("Confirmation Date must have a value")
        if not hasattr(self, "caseReference"):
            raise ValidationError("Case Reference is mandatory")
        elif self.caseReference is None:
            raise ValidationError("Case Reference must have a value")
        self.caseReference.validate()
        print(f"validating custom fields {self.custom_fields}")
        for field in self.custom_fields:
            if field.required is True and attrgetter(field.key)(self) is None:
                raise ValidationError(f"{field.key} must have a value")


observers = []

# Actually we want to capture extra fields which can be specified dynamically:
# so Case is the class that you should use.


def make_custom_case_class(name: str, fields=[], field_models=[]) -> type:
    """Generate a class extending the DayZeroCase class with additional fields.
    fields is a list of dataclass fields that should be added to the generated class.
    field_models is a list of model objects describing the fields for the data dictionary
    and for validation."""
    # FIXME generate the fields list from the field_models
    global Case
    try:
        new_case_class = dataclasses.make_dataclass(name, fields, bases=(DayZeroCase,))
    except TypeError as e:
        raise DependencyFailedError(*(e.args))
    new_case_class.custom_fields = field_models
    for observer in observers:
        observer(new_case_class)
    # also store it locally so anyone who does import Case from here gets the new one from now on
    Case = new_case_class
    return new_case_class


def observe_case_class(observer: Callable[[type], None]) -> None:
    """When someone imports a class by name, they get a reference to that class object.
    Unfortunately that means that when we recreate the Case class (e.g. because someone
    calls make_custom_case_class) nobody finds out about that. They would if we modified
    the existing Case class, but dataclasses doesn't provide for that. So provide a
    mechanism for importers to discover that the class has been recreated. An implementation of
    observer will probably look something like this:

    def observer(new_case_class: type) -> None:
        global Case
        Case = new_case_class

    But you could also do something more subtle (like rewrite the __class__ on instances of Case
    you already have, or recreate a working set of Cases).

    This function calls the observer so that clients can get the initial definition of Case without
    also having to import that."""
    observers.append(observer)
    observer(Case)


def remove_case_class_observer(observer: Callable[[type], None]) -> None:
    """When you're done watching for changes to Case, call this."""
    observers.remove(observer)


def reset_custom_case_fields() -> None:
    """When you want to get back to where you started, for example to load the field definitions from
    storage or if you're writing tests that modify the Case class."""
    make_custom_case_class("Case", [], [])


def add_field_to_case_class(field_model: Field) -> None:
    existing_fields = dataclasses.fields(Case)
    field_models = Case.custom_fields
    if field_model.key in [f.name for f in existing_fields]:
        raise ConflictError(f"field {field_model.key} already exists")
    if field_model.type not in Field.acceptable_types:
        raise PreconditionUnsatisfiedError(
            f"cannot use {field_model.type} as the type of a field"
        )
    if field_model.required is True and field_model.default is None:
        raise PreconditionUnsatisfiedError(
            f"field {field_model.key} is required so it must have a default value"
        )
    fields_list = [(f.name, f.type, f) for f in existing_fields]
    fields_list.append(field_model.dataclasses_tuple())
    field_models.append(field_model)
    # re-invent the Case class
    make_custom_case_class("Case", fields_list, field_models)


# let's start with a clean slate on first load
reset_custom_case_fields()
