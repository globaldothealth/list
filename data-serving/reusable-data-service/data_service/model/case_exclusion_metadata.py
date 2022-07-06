import dataclasses


@dataclasses.dataclass
class CaseExclusionMetadata:
    """If a case is excluded, record when and why."""

    _: dataclasses.KW_ONLY
    note: str = dataclasses.field(init=False, default=None)

    @classmethod
    def exclude_from_download(cls):
        return True
