import dataclasses
import datetime


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
