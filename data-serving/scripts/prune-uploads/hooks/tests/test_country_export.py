import pytest
import hooks.country_export as T

# some sources (only name and countryCodes)
_NORTH_AMERICA = {"name": "North America", "countryCodes": ["US", "CA", "MX"]}
_REUNION = {"name": "Reunion", "countryCodes": ["RE"]}
_INVALID = {"name": "Asgard", "countryCodes": ["AA"]}
_NEW_ZEALAND = {"name": "New Zealand"}


@pytest.mark.parametrize(
    "source,expected", [("Réunion", "Reunion"), ("Côte d'Ivoire", "Cote d'Ivoire")]
)
def test_to_ascii(source, expected):
    assert T.to_ascii(source) == expected


@pytest.mark.parametrize(
    "source,expected",
    [
        (
            _NORTH_AMERICA,
            {"prod-exporter-US", "prod-exporter-CA", "prod-exporter-MX"},
        ),
        (_REUNION, {"prod-exporter-RE"}),
        (_NEW_ZEALAND, {"prod-exporter-NZ"}),
        (_INVALID, set()),
    ],
)
def test_get_exporters(source, expected):
    assert T.get_exporters(source, "prod") == expected
