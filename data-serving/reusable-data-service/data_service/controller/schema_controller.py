import dataclasses

from data_service.model.case import Case, make_custom_case_class
from data_service.util.errors import ConflictError


class SchemaController:
    """Manipulate the fields on the Case class."""

    def add_field(self, name: str, type: type):
        global Case
        """Add a field of the specified type to the Case class. There cannot
        already be a field of that name, either built in, as part of the
        DayZeroCase schema, or added through this method previously.
        
        Additionally dataclasses imposes other conditions (for example names
        cannot be Python keywords)."""
        existing_fields = dataclasses.fields(Case)
        if name in [f.name for f in existing_fields]:
            raise ConflictError(f"field {name} already exists")
        fields_list = [(f.name, f.type, f) for f in existing_fields]
        fields_list.append((name, type, dataclasses.field(init=False, default=None)))
        # re-invent the Case class
        Case = make_custom_case_class("Case", fields_list)
