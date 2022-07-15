import dataclasses
from datetime import date


class Field:
    """Represents a custom field in a Document object."""

    STRING = str
    DATE = date
    acceptable_types = [STRING, DATE]
