import pytest

from contextlib import contextmanager

from data_service.model.geojson import Point, Feature
from data_service.util.errors import ValidationError


@contextmanager
def does_not_raise(exception):
    try:
        yield
    except exception:
        raise pytest.fail(f"Exception {exception} expected not to be raised")


def test_point_needs_two_coordinates():
    p = Point()
    p.coordinates = []
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [0]
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [1, 2, 3]
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [1, 2]
    with does_not_raise(ValidationError):
        p.validate()


def test_point_type_must_not_change():
    p = Point()
    p.type = "Polygon"
    p.coordinates = [4, 5]
    with pytest.raises(ValidationError):
        p.validate()
    p.type = "Point"
    with does_not_raise(ValidationError):
        p.validate()


def test_point_coordinates_must_be_in_range():
    p = Point()
    p.coordinates = [-91, 0]
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [91, 0]
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [0, -181]
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [0, 181]
    with pytest.raises(ValidationError):
        p.validate()
    p.coordinates = [0, 0]
    with does_not_raise(ValidationError):
        p.validate()


def test_feature_must_have_valid_point():
    p = Point()
    f = Feature()
    f.properties = {"country": "USA"}
    f.geometry = p
    with pytest.raises(ValidationError):
        f.validate()
    p.coordinates = [0, 0]
    with does_not_raise(ValidationError):
        f.validate()


def test_feature_must_have_feature_type():
    p = Point()
    p.coordinates = [0, 0]
    f = Feature()
    f.properties = {"country": "GBR"}
    f.geometry = p
    f.type = "Bug"
    with pytest.raises(ValidationError):
        f.validate()
    f.type = "Feature"
    with does_not_raise(ValidationError):
        f.validate()


def test_feature_must_have_three_letter_country_property():
    p = Point()
    p.coordinates = [0, 0]
    f = Feature()
    f.geometry = p
    f.properties = {}
    with pytest.raises(ValidationError):
        f.validate()
    f.properties = {"country": "Portugal"}
    with pytest.raises(ValidationError):
        f.validate()
    f.properties = {"country": "IN"}
    with pytest.raises(ValidationError):
        f.validate()
    f.properties = {"country": "VNM"}
    with does_not_raise(ValidationError):
        f.validate()
