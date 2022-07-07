import dataclasses
import datetime
import json
import flask.json

from typing import Any, List

from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.case_reference import CaseReference
from data_service.model.document import Document
from data_service.util.errors import (
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


# Actually we want to capture extra fields which can be specified dynamically:
# so Case is the class that you should use.
Case = dataclasses.make_dataclass("Case", fields=[], bases=(DayZeroCase,))
