import dataclasses
from data_service.model.case import Case
from typing import List, Optional


@dataclasses.dataclass
class CasePage:
    """Represents a page in a list of cases."""

    cases: List[Case]
    total: int
    nextPage: Optional[int] = None
