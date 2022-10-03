import dataclasses

from datetime import date
from typing import Any, List, Optional, Union

from data_service.model.case import add_field_to_case_class, observe_case_class
from data_service.model.field import Field
from data_service.util.errors import PreconditionUnsatisfiedError

Case = None


def case_class_observer(cls: type):
    global Case
    Case = cls


class SchemaController:
    """Manipulate the fields on the Case class."""

    def __init__(self, store):
        self.store = store
        self.restore_saved_fields()
        observe_case_class(case_class_observer)

    def restore_saved_fields(self) -> None:
        """Find previously-created fields in the store and apply them."""
        fields = self.store.get_case_fields()
        for field in fields:
            self.add_field(
                field.key,
                field.type,
                field.data_dictionary_text,
                field.required,
                field.default,
                field.values,
                field.is_list,
                False,
            )

    def add_field(
        self,
        name: str,
        type_name: str,
        description: str,
        required: bool = False,
        default: Optional[Union[bool, str, int, date]] = None,
        values: Optional[List[Any]] = None,
        is_list: bool = False,
        store_field: bool = True,
    ):
        global Case
        """Add a field of the specified type to the Case class. There cannot
        already be a field of that name, either built in, as part of the
        DayZeroCase schema, or added through this method previously.
        
        Additionally dataclasses imposes other conditions (for example names
        cannot be Python keywords).
        
        The description will be used in the data dictionary.
        
        Fields will by default be added to the store. Set store_field to False if this is not
        necessary, for example if the field to be added is coming from the store.
        
        If a field is required, set required = True. You must also set a default value so that
        existing cases have an initial setting for the field."""
        required = required if required is not None else False
        field_model = Field(
            name, type_name, description, required, default, values, is_list
        )
        add_field_to_case_class(field_model)
        if store_field:
            self.store.add_field(field_model)
