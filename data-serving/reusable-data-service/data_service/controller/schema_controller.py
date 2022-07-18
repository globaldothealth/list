import dataclasses

from data_service.model.case import Case, make_custom_case_class
from data_service.model.field import Field
from data_service.util.errors import ConflictError, PreconditionUnsatisfiedError


class SchemaController:
    """Manipulate the fields on the Case class."""

    def __init__(self, store):
        self.store = store

    def add_field(self, name: str, type_name: str, description: str):
        global Case
        """Add a field of the specified type to the Case class. There cannot
        already be a field of that name, either built in, as part of the
        DayZeroCase schema, or added through this method previously.
        
        Additionally dataclasses imposes other conditions (for example names
        cannot be Python keywords).
        
        The description will be used in the data dictionary."""
        existing_fields = dataclasses.fields(Case)
        if name in [f.name for f in existing_fields]:
            raise ConflictError(f"field {name} already exists")
        if type_name not in Field.acceptable_types:
            raise PreconditionUnsatisfiedError(
                f"cannot use {type_name} as the type of a field"
            )
        type = Field.model_type(type_name)
        fields_list = [(f.name, f.type, f) for f in existing_fields]
        fields_list.append((name, type, dataclasses.field(init=False, default=None)))
        # re-invent the Case class
        Case = make_custom_case_class("Case", fields_list)
        # create a storable model of the field and store it
        # FIXME rewrite the validation logic above to use the data model
        field_model = Field(name, type_name, description)
        self.store.add_field(field_model)
