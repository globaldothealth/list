import pytest

from data_service.controller.schema_controller import SchemaController
from data_service.model.case import (
    observe_case_class,
    remove_case_class_observer,
    reset_custom_case_fields,
)
from data_service.model.field import Field
from data_service.util.errors import (
    ConflictError,
    DependencyFailedError,
    PreconditionUnsatisfiedError,
)

Case = None


def case_observer(case_class: type) -> None:
    global Case
    Case = case_class


@pytest.fixture
def schema_controller():
    observe_case_class(case_observer)
    yield SchemaController()
    remove_case_class_observer(case_observer)
    reset_custom_case_fields()


def test_adding_string_field_to_case_schema(schema_controller):
    schema_controller.add_field("custom_field", Field.STRING)
    assert "custom_field" in Case.field_names()
    assert Case.field_type("custom_field") is str


def test_cannot_shadow_day_zero_field(schema_controller):
    with pytest.raises(ConflictError):
        schema_controller.add_field("confirmationDate", Field.DATE)


def test_must_appease_dataclasses(schema_controller):
    with pytest.raises(DependencyFailedError):
        schema_controller.add_field("yield", Field.STRING)


def test_cannot_use_arbitrary_type(schema_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        schema_controller.add_field("my_field", set)
