import dataclasses
import datetime
import json

from typing import Any


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
    confirmation_date: datetime.date = dataclasses.field(init=False)

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
            else:
                value = dictionary[key]
            setattr(case, key, value)
        case.validate()
        return case

    def validate(self):
        """Check whether I am consistent. Raise ValueError if not."""
        if not hasattr(self, "confirmation_date"):
            raise ValueError("Confirmation Date is mandatory")
        elif self.confirmation_date is None:
            raise ValueError("Confirmation Date must have a value")
    
    def to_dict(self):
        """Return myself as a dictionary."""
        return dataclasses.asdict(self)

    @classmethod
    def date_fields(cls) -> list[str]:
        """Record where dates are kept because they sometimes need special treatment.
        A subclass could override this method to indicate it stores additional date fields."""
        return ["confirmation_date"]


# Actually we want to capture extra fields which can be specified dynamically:
# so Case is the class that you should use.
Case = dataclasses.make_dataclass("Case", fields=[], bases=(DayZeroCase,))
