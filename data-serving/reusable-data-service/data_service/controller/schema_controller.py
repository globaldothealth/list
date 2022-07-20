import dataclasses

from datetime import date
from typing import Optional, Union

from data_service.model.case import Case, make_custom_case_class
from data_service.model.field import Field
from data_service.util.errors import ConflictError, PreconditionUnsatisfiedError


class SchemaController:
    """Manipulate the fields on the Case class."""

    def __init__(self, store):
        self.store = store
        self.restore_saved_fields()

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
                False,
            )

    def add_field(
        self,
        name: str,
        type_name: str,
        description: str,
        required: bool = False,
        default: Optional[Union[bool, str, int, date]] = None,
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
        existing_fields = dataclasses.fields(Case)
        if name in [f.name for f in existing_fields]:
            raise ConflictError(f"field {name} already exists")
        if type_name not in Field.acceptable_types:
            raise PreconditionUnsatisfiedError(
                f"cannot use {type_name} as the type of a field"
            )
        if required is True and default is None:
            raise PreconditionUnsatisfiedError(
                f"field {name} is required so it must have a default value"
            )
        type = Field.model_type(type_name)
        fields_list = [(f.name, f.type, f) for f in existing_fields]
        fields_list.append((name, type, dataclasses.field(init=False, default=None)))
        # re-invent the Case class
        Case = make_custom_case_class("Case", fields_list)
        if store_field:
            # create a storable model of the field and store it
            # FIXME rewrite the validation logic above to use the data model
            required = required if required is not None else False
            field_model = Field(name, type_name, description, required, default)
            self.store.add_field(field_model)
