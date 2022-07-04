import dataclasses
from typing import Dict

from reusable_data_service.model.case import Case


@dataclasses.dataclass
class CaseUpsertOutcome:
    """Represents the result of a batch upsert operation: the number
    of cases created, the number updated, and the errors encountered."""

    numCreated: int
    numUpdated: int
    errors: Dict[str, str]
