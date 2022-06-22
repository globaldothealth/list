from typing import Any, List


class Filter:
    """Represents any filter on a collection."""

    pass


class Anything(Filter):
    """Represents a lack of constraints."""

    pass


class PropertyFilter(Filter):
    """Represents a test that an object's property has a value that satisfies some constraint."""

    def __init__(self, property_name: str, operation: str, value: Any):
        valid_ops = [FilterOperator.LESS_THAN, FilterOperator.GREATER_THAN]
        if operation not in valid_ops:
            raise ValueError(f"Unknown operation {operation}")
        self.property_name = property_name
        self.operation = operation
        self.value = value


class FilterOperator:
    LESS_THAN = "<"
    GREATER_THAN = ">"


class AndFilter(Filter):
    """Represents a composition of filters, satisfied if all components are satisfied."""

    def __init__(self, filters: List[Filter]):
        self.filters = filters
