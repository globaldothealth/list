import pytest
from src.app import main


@pytest.fixture
def client():
    main.app.config['TESTING'] = True
    client = main.app.test_client()
    yield client


def test_coordinate_conversion(client):
    response = client.get('/geocode/convertUTM?n=1017001&e=650771&z=17')
    result = response.get_json()
    assert result is not None
    assert "latitude" in result
    assert result['latitude'] == 9.197726112080002
    assert 'longitude' in result
    assert result['longitude'] == -79.62765393281299
