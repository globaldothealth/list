import dataclasses
import datetime

from typing import Any


@dataclasses.dataclass
class CaseExclusionMetadata:
    """If a case is excluded, record when and why."""

    _: dataclasses.KW_ONLY
    note: str = dataclasses.field(init=False, default=None)
    date: datetime.date = dataclasses.field(
        init=False, default=None
    )  # Populate at initialisation time, not class load time

    def __post_init__(self):
        self.date = datetime.datetime.now().date()

    @classmethod
    def exclude_from_download(cls):
        return True

    @classmethod
    def date_fields(cls) -> list[str]:
        """Record where dates are kept because they sometimes need special treatment."""
        return [f.name for f in dataclasses.fields(cls) if f.type == datetime.date]

    @classmethod
    def from_dict(cls, dictionary: dict[str, Any]) -> type:
        """Create a CaseExclusionMetadata from a dictionary representation."""
        exclusion = CaseExclusionMetadata()
        exclusion.note = dictionary.get("note")
        # TODO move this and the Case implementation into a common place
        maybe_date = dictionary.get("date")
        value = None
        if maybe_date is None:
            raise ValueError(
                f"date missing in CaseExclusionMetadata dictionary {dictionary}"
            )
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
        exclusion.date = value
        return exclusion
