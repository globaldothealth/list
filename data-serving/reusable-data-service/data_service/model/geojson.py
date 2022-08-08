import dataclasses

from typing import Any, Dict, List

from data_service.util.errors import ValidationError


@dataclasses.dataclass
class Point:
    """Represents a GeoJSON point, but because we only deal with lat/long
    coordinates it has the additional validation constraint that it must be
    two-dimensional and be in the range ((-90<=lat<=90), (-180<=lon<=180))."""

    _: dataclasses.KW_ONLY
    type: str = dataclasses.field(init=False, default="Point")
    coordinates: List[float] = dataclasses.field(init=False, default_factory=lambda: [])

    def validate(self):
        if self.type != "Point":
            raise ValidationError(f"Type must be Point for a Point, not {self.type}")
        if self.coordinates is None:
            raise ValidationError("Point must have coordinates")
        if len(self.coordinates) != 2:
            raise ValidationError(
                f"Point must have two coordinates, I have {len(self.coordinates)}"
            )
        latitude = self.coordinates[0]
        if latitude < -90.0 or latitude > 90.0:
            raise ValidationError(
                f"latitude must be between -90º and 90º, got {latitude}"
            )
        longitude = self.coordinates[1]
        if longitude < -180.0 or longitude > 180.0:
            raise ValidationError(
                f"longitude must be between -180º and 180º, got {longitude}"
            )

    @classmethod
    def from_dict(cls, d: Dict[str, Any]):
        p = cls()
        p.type = d.get("type", None)
        p.coordinates = d.get("coordinates", None)
        return p


@dataclasses.dataclass
class Feature:
    """Represents a GeoJSON feature, but with restrictions that are appropriate
    to Global.health. To whit: the geometry _must_ be a point (it cannot be a MultiPoint,
    a Line, or any other type of geometry, and nor can it be None);
    the properties dictionmary _must_ include a three-letter
    country code. These constraints are tested at validation time, not construction time."""

    _: dataclasses.KW_ONLY
    type: str = dataclasses.field(init=False, default="Feature")
    geometry: Point = dataclasses.field(init=False, default=None)
    properties: Dict[str, Any] = dataclasses.field(
        init=False, default_factory=lambda: {}
    )
    field_getters = {
        "country": lambda f: f.properties.get("country", ""),
        "latitude": lambda f: str(f.geometry.coordinates[0]),
        "longitude": lambda f: str(f.geometry.coordinates[1]),
        "admin1": lambda f: f.properties.get("admin1", ""),
        "admin2": lambda f: f.properties.get("admin2", ""),
        "admin3": lambda f: f.properties.get("admin3", ""),
    }

    def validate(self):
        if self.type != "Feature":
            raise ValidationError(
                f"Type must be Feature for a Feature, not {self.type}"
            )
        if not isinstance(self.geometry, Point):
            raise ValidationError(
                f"geometry of a Feature must be a Point in G.h, {self.geometry} is not one"
            )
        self.geometry.validate()
        country = self.properties.get("country", "None")
        if len(country) != 3:
            raise ValidationError(
                f"country must be defined as an ISO 3166-1 alpha-3 code, not {country}"
            )

    @classmethod
    def from_dict(cls, d: Dict[str, Any]):
        if d is None:
            return None
        f = cls()
        f.type = d.get("type", None)
        f.properties = d.get("properties", None)
        g = d.get("geometry", None)
        f.geometry = Point.from_dict(g) if g is not None else None
        return f

    @classmethod
    def custom_field_names(cls) -> List[str]:
        """Provide an application-specific report of this class's fields and values for CSV export."""
        return list(cls.field_getters.keys())

    @classmethod
    def custom_none_field_values(cls) -> List[str]:
        """Provide an application-specific report of this class's fields and values for CSV export."""
        return [""] * len(cls.field_getters)

    def custom_field_values(self) -> List[str]:
        """Provide an application-specific report of this class's fields and values for CSV export."""
        return [getter(self) for getter in self.field_getters.values()]
