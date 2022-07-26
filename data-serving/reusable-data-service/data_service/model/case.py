import dataclasses
import datetime
import importlib.resources
import json

from collections.abc import Callable

from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.case_reference import CaseReference
from data_service.model.document import Document
from data_service.model.field import Field
from data_service.model.geojson import Feature
from data_service.util.errors import (
    ConflictError,
    DependencyFailedError,
    PreconditionUnsatisfiedError,
)


observers = []

def make_custom_case_class(name: str, field_models=[]) -> type:
    """Generate a class extending the DayZeroCase class with additional fields.
    field_models is a list of model objects describing the fields for the data dictionary
    and for validation."""
    global Case
    fields = [f.dataclasses_tuple() for f in field_models]
    try:
        new_case_class = dataclasses.make_dataclass(name, fields, bases=(Document,))
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
    day_zero_field_definitions = json.loads(importlib.resources.read_text('data_service', 'day_zero_fields.json'))
    day_zero_fields = [Field.from_dict(f) for f in day_zero_field_definitions]
    make_custom_case_class("Case", day_zero_fields)


def add_field_to_case_class(field_model: Field) -> None:
    field_models = Case.custom_fields
    if field_model.key in [f.key for f in field_models]:
        raise ConflictError(f"field {field_model.key} already exists")
    if field_model.type not in Field.acceptable_types:
        raise PreconditionUnsatisfiedError(
            f"cannot use {field_model.type} as the type of a field"
        )
    if field_model.required is True and field_model.default is None:
        raise PreconditionUnsatisfiedError(
            f"field {field_model.key} is required so it must have a default value"
        )
    field_models.append(field_model)
    # re-invent the Case class
    make_custom_case_class("Case", field_models)


# let's start with a clean slate on first load
reset_custom_case_fields()
