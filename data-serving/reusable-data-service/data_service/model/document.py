import dataclasses
import datetime

from data_service.util.json_encoder import JSONEncoder

from typing import List

@dataclasses.dataclass
class Document:
    """The base class for anything that's going into the database."""

    def to_dict(self):
        """Me, as a dictionary."""
        return dataclasses.asdict(self)

    def to_json(self):
        """Return myself as JSON"""
        return JSONEncoder().encode(self.to_dict())

    @classmethod
    def date_fields(cls) -> list[str]:
        """Record where dates are kept because they sometimes need special treatment."""
        return [f.name for f in dataclasses.fields(cls) if f.type == datetime.date]

    @staticmethod
    def interpret_date(maybe_date) -> datetime.date:
        value = None
        if maybe_date is None:
            value = None
        if isinstance(maybe_date, datetime.datetime):
            value = maybe_date.date()
        elif isinstance(maybe_date, datetime.date):
            value = maybe_date
        elif isinstance(maybe_date, str):
            value = datetime.datetime.strptime(
                maybe_date, "%Y-%m-%dT%H:%M:%S.%fZ"
            ).date()
        elif isinstance(maybe_date, dict) and "$date" in maybe_date:
            value = datetime.datetime.strptime(
                maybe_date["$date"], "%Y-%m-%dT%H:%M:%SZ"
            ).date()
        else:
            raise ValueError(f"Cannot interpret date {maybe_date}")
        return value

    @classmethod
    def field_names(cls) -> List[str]:
        """The list of names of fields in this class and member dataclasses."""
        fields = []
        for f in dataclasses.fields(cls):
            if dataclasses.is_dataclass(f.type):
                if cls.include_dataclass_fields(f.type):
                    fields += [f"{f.name}.{g.name}" for g in dataclasses.fields(f.type)]
            else:
                fields.append(f.name)
        return fields

    @classmethod
    def delimiter_separated_header(cls, sep: str) -> str:
        """Create a line naming all of the fields in this class and member dataclasses."""
        return sep.join(cls.field_names()) + "\n"

    @classmethod
    def tsv_header(cls) -> str:
        """Generate the header row for a TSV file containing members of this class."""
        return cls.delimiter_separated_header("\t")

    @classmethod
    def csv_header(cls) -> str:
        """Generate the header row for a CSV file containing members of this class."""
        return cls.delimiter_separated_header(",")

    @classmethod
    def json_header(cls) -> str:
        """The start of a JSON array."""
        return "["

    @classmethod
    def json_footer(cls) -> str:
        """The end of a JSON array."""
        return "]"

    @classmethod
    def json_separator(cls) -> str:
        """The string between values in a JSON array."""
        return ","

    def field_values(self) -> List[str]:
        """The list of values of fields on this object and member dataclasses."""
        fields = []
        for f in dataclasses.fields(self):
            value = getattr(self, f.name)
            if issubclass(f.type, Document):
                if self.include_dataclass_fields(f.type):
                    fields += value.field_values()
            else:
                fields.append(str(value) if value is not None else "")
        return fields

    @staticmethod
    def include_dataclass_fields(aType: type):
        test_exclusion = getattr(aType, "exclude_from_download", None)
        return test_exclusion is None or test_exclusion() is False

    def delimiter_separated_values(self, sep: str) -> str:
        """Create a line listing all of the fields in me and my member dataclasses."""
        return sep.join(self.field_values()) + "\n"

    def to_tsv(self) -> str:
        """Generate a row in a CSV file representing myself."""
        return self.delimiter_separated_values("\t")

    def to_csv(self) -> str:
        """Generate a row in a CSV file representing myself."""
        return self.delimiter_separated_values(",")
