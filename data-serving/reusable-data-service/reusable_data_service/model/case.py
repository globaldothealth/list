import dataclasses
import datetime
import json

from typing import Any

from reusable_data_service.model.case_reference import CaseReference


@dataclasses.dataclass()
class DayZeroCase:
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
                # handle a few different ways dates get represented in dictionaries
                maybe_date = dictionary[key]
                if isinstance(maybe_date, datetime.datetime):
                    value = maybe_date.date()
                elif isinstance(maybe_date, datetime.date):
                    value = maybe_date
                elif isinstance(maybe_date, str):
                    value = datetime.datetime.strptime(
                        maybe_date, "%Y-%m-%dT%H:%M:%S.%fZ"
                    ).date()
                elif isinstance(maybe_date, dict) and "$date" in maybe_date:
                    value = datetime.datetime.strptime(
                        maybe_date["$date"], "%Y-%m-%dT%H:%M:%SZ"
                    ).date()
                else:
                    raise ValueError(f"Cannot interpret date {maybe_date}")
            elif key == "caseReference":
                caseRef = dictionary[key]
                value = (
                    CaseReference.from_dict(caseRef) if caseRef is not None else None
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
        """Check whether I am consistent. Raise ValueError if not."""
        if not hasattr(self, "confirmationDate"):
            raise ValueError("Confirmation Date is mandatory")
        elif self.confirmationDate is None:
            raise ValueError("Confirmation Date must have a value")
        if not hasattr(self, "caseReference"):
            raise ValueError("Case Reference is mandatory")
        elif self.caseReference is None:
            raise ValueError("Case Reference must have a value")
        self.caseReference.validate()

    def to_dict(self):
        """Return myself as a dictionary."""
        return dataclasses.asdict(self)

    @classmethod
    def date_fields(cls) -> list[str]:
        """Record where dates are kept because they sometimes need special treatment."""
        return [f.name for f in dataclasses.fields(cls) if f.type == datetime.date]


# Actually we want to capture extra fields which can be specified dynamically:
# so Case is the class that you should use.
Case = dataclasses.make_dataclass("Case", fields=[], bases=(DayZeroCase,))
