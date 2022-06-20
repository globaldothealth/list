import dataclasses
import datetime
import json


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
    confirmation_date: datetime.datetime = dataclasses.field(init=False)

    @classmethod
    def from_json(cls, obj: str) -> type:
        """Create an instance of this class from a JSON representation."""
        case = cls()
        source = json.loads(obj)
        for key in source:
            if key in ["confirmation_date"]:
                # parse as an ISO 8601 date
                date = datetime.datetime.strptime(source[key], "%Y-%m-%dT%H:%M:%S.%fZ")
                setattr(case, key, date)
            else:
                setattr(case, key, source[key])
        case.validate()
        return case

    def validate(self):
        """Check whether I am consistent. Raise ValueError if not."""
        if not hasattr(self, "confirmation_date"):
            raise ValueError("Confirmation Date is mandatory")
        elif self.confirmation_date is None:
            raise ValueError("Confirmation Date must have a value")


# Actually we want to capture extra fields which can be specified dynamically:
# so Case is the class that you should use.
Case = dataclasses.make_dataclass("Case", fields=[], bases=(DayZeroCase,))
