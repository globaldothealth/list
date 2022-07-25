import json
import pytest

from datetime import date
from typing import List

from data_service.controller.case_controller import CaseController
from data_service.controller.geocode_controller import Geocoder
from data_service.model.geojson import Feature, Point
from data_service.stores.memory_store import MemoryStore

class FakeGeocoder:
    def __init__(self, ignored_url: str):
        self.returned_feature = None

    def locate_feature(self, query: str) -> List[Feature]:
        return [self.returned_feature]


@pytest.fixture
def case_controller():
    store = MemoryStore()
    geocoder = FakeGeocoder('https://geocode.example')
    controller = CaseController(store, outbreak_date=date(2019, 11, 1), geocoder=geocoder)
    yield controller


def test_geocodes_a_case_with_location_query(case_controller):
    feature = Feature()
    point = Point()
    point.coordinates = [1.234, 5.678]
    feature.geometry = point
    feature.properties = { "country": "ESP" }
    case_controller.geocoder.returned_feature = feature

    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_dict = json.load(minimal_file)
    case_dict['location'] = { "query": "some_feature" }
    case_controller.create_case(case_dict)

    cases = case_controller.list_cases().cases
    assert len(cases) == 1
    case = cases[0]
    assert case.location == feature
