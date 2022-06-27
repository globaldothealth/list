import bson
import dataclasses

@dataclasses.dataclass
class CaseReference:
    """Represents information about the source of a given case."""
    _: dataclasses.KW_ONLY
    sourceId: bson.ObjectId = dataclasses.field(init=False, default=None)
    sourceEntryId: str = dataclasses.field(init=False, default=None)

    @staticmethod
    def from_dict(d: dict[str, str]):
        """Create a CaseReference from a dictionary representation."""
        ref = CaseReference()
        if 'sourceId' in d:
            ref.sourceId = bson.ObjectId(d['sourceId'])
        if 'sourceEntryId' in d:
            ref.sourceEntryId = d['sourceEntryId']
        return ref
