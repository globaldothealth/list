import pytest

from data_service.model.age_range import AgeRange
from data_service.util.errors import ValidationError

from tests.util import does_not_raise


def test_age_range_massages_input_to_match_buckets():
    ages = AgeRange(2,6)
    assert ages.lower == 1
    assert ages.upper == 10


def test_age_range_leaves_input_if_it_is_already_on_bucket_boundary():
    ages = AgeRange(6, 10)
    assert ages.lower == 6
    assert ages.upper == 10


def test_age_range_invalid_if_boundaries_are_None():
    ages = AgeRange(None, None)
    with pytest.raises(ValidationError):
        ages.validate()
    ages = AgeRange(None, 12)
    with pytest.raises(ValidationError):
        ages.validate()
    ages = AgeRange(5, None)
    with pytest.raises(ValidationError):
        ages.validate()


def test_age_range_invalid_if_lower_bound_negative():
    ages = AgeRange(-12, 4)
    with pytest.raises(ValidationError):
        ages.validate()


def test_age_range_invalid_if_upper_bound_negative():
    ages = AgeRange(5, -27)
    with pytest.raises(ValidationError):
        ages.validate()


def test_age_range_invalid_if_upper_bound_methuselan():
    ages = AgeRange(15, 150)
    with pytest.raises(ValidationError):
        ages.validate()


def test_age_range_ok_for_infants():
    ages = AgeRange(0, 1)
    with does_not_raise(ValidationError):
        ages.validate()


def test_age_range_ok_for_large_positive_range():
    ages = AgeRange(30, 45)
    with does_not_raise(ValidationError):
        ages.validate()
