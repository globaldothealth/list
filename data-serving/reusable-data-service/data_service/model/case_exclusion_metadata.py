import dataclasses
import datetime

from typing import Any

from data_service.model.document import Document

@dataclasses.dataclass
class CaseExclusionMetadata(Document):
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
    def from_dict(cls, dictionary: dict[str, Any]) -> type:
        """Create a CaseExclusionMetadata from a dictionary representation."""
        exclusion = CaseExclusionMetadata()
        exclusion.note = dictionary.get("note")
        exclusion.date = cls.interpret_date(dictionary.get("date"))
        if exclusion.date is None:
            raise ValueError(f"date missing in CaseExclusion document {dict}")
        return exclusion
