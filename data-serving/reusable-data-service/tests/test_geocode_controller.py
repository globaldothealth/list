import pytest
import requests_mock

from data_service.controller.geocode_controller import Geocoder


def test_geocode_controller_adapts_response_to_geojson(requests_mock):
    requests_mock.get(
        "https://geocode.example/location-service/geocode",
        json=[
            {
                "geometry": {"latitude": 33.798670, "longitude": -84.326972},
                "country": "US",
                "administrativeAreaLevel1": "Georgia",
                "administrativeAreaLevel2": "DeKalb County",
                "administrativeAreaLevel3": "Atlanta",
                "place": "1600 Clifton Road NE",
                "name": "Centers for Disease Control and Prevention",
                "geoResolution": "Point",
            }
        ],
    )
    controller = Geocoder("https://geocode.example/location-service")
    locations = controller.locate_feature("CDC Atlanta")
    assert len(locations) == 1
    location = locations[0]
    assert location.type == "Feature"
    assert location.geometry.coordinates == [33.798670, -84.326972]
    props = location.properties
    assert props["country"] == "USA"
    assert props["admin1"] == "Georgia"
    assert props["admin2"] == "DeKalb County"
    assert props["admin3"] == "Atlanta"
    assert props["place"] == "1600 Clifton Road NE"
    assert props["name"] == "Centers for Disease Control and Prevention"
    assert props["resolution"] == "Point"
    assert props["query"] == "CDC Atlanta"
