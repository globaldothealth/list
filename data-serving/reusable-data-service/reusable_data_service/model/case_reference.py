import bson
import dataclasses

@dataclasses.dataclass
class CaseReference:
    """Represents information about the source of a given case."""
    _: dataclasses.KW_ONLY
    sourceId: bson.ObjectId = dataclasses.field(init=False, default=None)
    sourceEntryId: str = dataclasses.field(init=False, default=None)
