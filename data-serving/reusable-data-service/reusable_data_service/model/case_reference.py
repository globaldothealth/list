import bson
import dataclasses


@dataclasses.dataclass
class CaseReference:
    """Represents information about the source of a given case."""

    _: dataclasses.KW_ONLY
    sourceId: bson.ObjectId = dataclasses.field(init=False, default=None)

    def validate(self):
        """Check whether I am consistent. Raise ValueError if not."""
        if not hasattr(self, "sourceId"):
            raise ValueError("Source ID is mandatory")
        elif self.sourceId is None:
            raise ValueError("Source ID must have a value")

    @staticmethod
    def from_dict(d: dict[str, str]):
        """Create a CaseReference from a dictionary representation."""
        ref = CaseReference()
        if "sourceId" in d:
            theId = d["sourceId"]
            if isinstance(theId, str):
                ref.sourceId = bson.ObjectId(theId)
            elif "$oid" in theId:
                ref.sourceId = bson.ObjectId(theId["$oid"])
            else:
                raise ValueError(f"Cannot interpret {theId} as an ObjectId")
        return ref

    def to_csv(self) -> str:
        """Generate a row in a CSV file representing myself."""
        fields = []
        for f in dataclasses.fields(self):
            if dataclasses.is_dataclass(f.type):
                fields.append(getattr(self, f.name).to_csv())
            else:
                fields.append(str(getattr(self, f.name)))
        return ",".join(fields)
