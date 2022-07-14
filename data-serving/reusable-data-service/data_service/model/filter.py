from typing import Any, List


class Filter:
    """Represents any filter on a collection."""

    def matches_everything(self) -> bool:
        """Indicate whether this filter is satisfied for all input."""
        return False


class Anything(Filter):
    """Represents a lack of constraints."""

    def __str__(self) -> str:
        return "Anything()"
    
    def matches_everything(self) -> bool:
        return True



class PropertyFilter(Filter):
    """Represents a test that an object's property has a value that satisfies some constraint."""

    def __init__(self, property_name: str, operation: str, value: Any):
        valid_ops = [FilterOperator.LESS_THAN, FilterOperator.GREATER_THAN]
        if operation not in valid_ops:
            raise ValueError(f"Unknown operation {operation}")
        self.property_name = property_name
        self.operation = operation
        self.value = value

    def __str__(self) -> str:
        return f"PropertyFilter({self.property_name} {self.operation} {self.value})"


class FilterOperator:
    LESS_THAN = "<"
    GREATER_THAN = ">"


class AndFilter(Filter):
    """Represents a composition of filters, satisfied if all components are satisfied."""

    def __init__(self, filters: List[Filter]):
        self.filters = filters

    def __str__(self) -> str:
        return f"AndFilter({' AND '.join([str(f) for f in self.filters])})"
