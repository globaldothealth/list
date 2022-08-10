import bson
import dataclasses

from data_service.model.document import Document


@dataclasses.dataclass
class CaseReference(Document):
    """Represents information about the source of a given case."""

    _: dataclasses.KW_ONLY
    sourceId: str = dataclasses.field(init=False, default=None)

    def validate(self):
        """Check whether I am consistent. Raise ValueError if not."""
        super().validate()
        if not hasattr(self, "sourceId"):
            raise ValueError("Source ID is mandatory")
        elif self.sourceId is None:
            raise ValueError("Source ID must have a value")

    @staticmethod
    def from_dict(d: dict[str, str]):
        """Create a CaseReference from a dictionary representation."""
        ref = CaseReference()
        ref.sourceId = d.get("sourceId")
        return ref
