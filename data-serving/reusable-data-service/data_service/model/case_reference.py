import bson
import dataclasses

from data_service.model.document import Document


@dataclasses.dataclass
class CaseReference(Document):
    """Represents information about the source of a given case."""

    _: dataclasses.KW_ONLY
    sourceId: str = dataclasses.field(init=False, default=None)
    status: str = dataclasses.field(init=False, default="UNVERIFIED")

    def validate(self):
        """Check whether I am consistent. Raise ValueError if not."""
        if not hasattr(self, "sourceId"):
            raise ValueError("Source ID is mandatory")
        elif self.sourceId is None:
            raise ValueError("Source ID must have a value")
        if self.status not in self.valid_statuses():
            raise ValueError(f"Status {self.status} is not acceptable")

    @staticmethod
    def valid_statuses():
        """A case reference must have one of these statuses."""
        return ["EXCLUDED", "UNVERIFIED", "VERIFIED"]

    @staticmethod
    def from_dict(d: dict[str, str]):
        """Create a CaseReference from a dictionary representation."""
        ref = CaseReference()
        ref.sourceId = d.get("sourceId")
        ref.status = d.get("status", "UNVERIFIED")
        return ref
