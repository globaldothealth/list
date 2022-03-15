import pytest
from os import environ
from src.app import main


@pytest.fixture
def client():
    main.app.config['TESTING'] = True
    client = main.app.test_client()
    yield client


def test_healthy_client(client):
    environ['MAPBOX_TOKEN'] = 'some_key'
    response = client.get('/health')
    result = response.get_json()
    assert result is not None
    assert "status" in result
    assert result["status"] == "Healthy"


def test_unhealthy_when_mapbox_key_not_set(client):
    del environ['MAPBOX_TOKEN']
    response = client.get('/health')
    result = response.get_json()
    assert response.status == '500 INTERNAL SERVER ERROR'
    assert result is not None
    assert "status" in result
    assert result["status"] == "Unhealthy"
    assert result["reason"] == "Mapbox API token is not present"

def test_does_not_attempt_geocode_with_no_query(client):
    response = client.get("/geocode")
    assert response.status == '400 BAD REQUEST'

def test_searching_for_country_name(client):
    response = client.get("/geocode/countryName?c=EE")
    assert response.get_data(as_text=True) == 'Estonia'
